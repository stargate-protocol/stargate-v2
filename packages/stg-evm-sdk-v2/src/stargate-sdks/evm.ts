import { JsonRpcProvider } from '@ethersproject/providers'
import { constants } from 'ethers'

import { IToken, StargatePoolConfigGetter } from '../bootstrap-config'
import { parallelProcess } from '../common-utils'
import { ERC20__factory } from '../openzeppelin-contracts'
import {
    CreditMessaging,
    LPToken__factory,
    StargateBase__factory,
    StargateContract,
    StargateContractType,
    StargateMultiRewarder__factory,
    StargatePool,
    StargatePoolNative,
    StargatePoolNative__factory,
    StargatePool__factory,
    StargateStaking,
    StargateTypes,
    TokenMessaging,
    connectStargateV2Contract,
    getStargateV2CreditMessagingContract,
    getStargateV2StargateStakingContract,
    getStargateV2TokenMessagingContract,
} from '../stargate-contracts'

import { ContractMetadata, StargateV2Sdk } from './model'
import { getNativeCurrencyDecimals, getNativeCurrencyInfo, getNativeCurrencySymbol } from './utils'

import type { Logger } from 'winston'

export class StargateV2EvmSdk implements StargateV2Sdk {
    protected tokenMessagingContract: TokenMessaging
    protected creditMessagingContract: CreditMessaging
    protected logger: Logger | Console

    private addressToContract: { [address: string]: StargateContract } = {}

    constructor(
        protected options: {
            chainName: string
            environment: string
            provider: JsonRpcProvider
            stargatePoolConfigGetter: StargatePoolConfigGetter
            logger: Logger | Console
        }
    ) {
        this.logger = this.options.logger
        this.tokenMessagingContract = getStargateV2TokenMessagingContract(
            options.chainName,
            options.environment,
            options.provider
        )
        this.creditMessagingContract = getStargateV2CreditMessagingContract(
            options.chainName,
            options.environment,
            options.provider
        )

        for (const assetId of this.options.stargatePoolConfigGetter.getAssetIds()) {
            try {
                const poolConfig = this.options.stargatePoolConfigGetter.getPoolInfo(assetId, this.options.chainName)

                this.addressToContract[poolConfig.address] = connectStargateV2Contract(
                    this.options.provider,
                    poolConfig.stargateType,
                    poolConfig.address
                )
            } catch {
                /* empty */
            }
        }
    }

    /**
     * Retrieves metadata for a specified contract address.
     * @param address The contract address to retrieve metadata for.
     * @returns An object containing the token address, stargateType, and optionally the name and symbol if the token is not a native pool.
     */

    public async contractMetadata(address: string): Promise<ContractMetadata> {
        let contract = StargateBase__factory.connect(address, this.options.provider)

        const [token, sharedDecimals] = await Promise.all([contract.token(), contract.sharedDecimals()])

        const metadata = {
            token: { address: token },
            sharedDecimals,
        }

        if (token === constants.AddressZero) {
            const { decimals, symbol } = getNativeCurrencyInfo(this.options.chainName)

            if (decimals == undefined) {
                throw new Error(`decimals of native token not set in static config for chain ${this.options.chainName}`)
            }

            contract = StargatePoolNative__factory.connect(address, this.options.provider)
            const lpTokenAddr = await (contract as StargatePoolNative).lpToken()
            const lpToken = LPToken__factory.connect(lpTokenAddr, this.options.provider)
            const [lpTokenSymbol, lpTokenDecimals] = await Promise.all([lpToken.symbol(), lpToken.decimals()])

            return {
                ...metadata,
                token: {
                    ...metadata.token,
                    decimals,
                    symbol,
                },
                stargateType: StargateTypes.NATIVE,
                lpToken: {
                    address: lpTokenAddr,
                    decimals: lpTokenDecimals,
                    symbol: lpTokenSymbol,
                },
            }
        }

        const onchainType = await contract.stargateType()
        const erc20 = ERC20__factory.connect(token, this.options.provider)
        const [symbol, decimals] = await Promise.all([erc20.symbol(), erc20.decimals()])

        const oftMetadata = {
            ...metadata,
            token: { ...metadata.token, decimals, symbol },
            stargateType: StargateContractType[onchainType] as StargateTypes,
        }
        // no farm metadata for stargate OFT
        if (StargateContractType[onchainType] === StargateTypes.OFT) {
            return oftMetadata
        }

        contract = StargatePool__factory.connect(address, this.options.provider)

        const lpTokenAddr = await (contract as StargatePool).lpToken()
        const lpToken = LPToken__factory.connect(lpTokenAddr, this.options.provider)
        const [lpTokenSymbol, lpTokenDecimals] = await Promise.all([lpToken.symbol(), lpToken.decimals()])

        return {
            ...oftMetadata,
            lpToken: {
                address: lpTokenAddr,
                decimals: lpTokenDecimals,
                symbol: lpTokenSymbol,
            },
        }
    }

    public async farmMetadata(): Promise<
        {
            lpToken: string
            address: string
            rewardTokens: IToken[]
        }[]
    > {
        const { chainName, environment, provider } = this.options

        let staking: StargateStaking

        try {
            staking = getStargateV2StargateStakingContract(chainName, environment, provider)
        } catch {
            return []
        }

        const stakedLpTokens = await staking['tokens()']()
        return Promise.all(
            stakedLpTokens.map(async (lpToken) => {
                const rewarderAddr = await staking.rewarder(lpToken)
                const rewarder = StargateMultiRewarder__factory.connect(rewarderAddr, provider)
                const [allTokens, _allAllocPoints] = await rewarder.allocPointsByStake(lpToken)
                return {
                    lpToken,
                    address: staking.address,
                    rewardTokens: await Promise.all(
                        allTokens.map(async (token, i) => {
                            if (token === constants.AddressZero) {
                                return {
                                    address: token,
                                    decimals: getNativeCurrencyDecimals(chainName),
                                    symbol: getNativeCurrencySymbol(chainName),
                                }
                            }
                            const erc20 = ERC20__factory.connect(token, provider)
                            const [symbol, decimals] = await Promise.all([erc20.symbol(), erc20.decimals()])
                            return {
                                address: token,
                                decimals,
                                symbol,
                            }
                        })
                    ),
                }
            })
        )
    }

    /**
     * Fetches and stores mappings of asset IDs to their corresponding stargate implementations,
     * and vice versa, from the tokenMessagingContract.
     */
    public async fetchPools(): Promise<{
        assetIds: { [impl: string]: number }
        stargateImpls: { [asset: number]: string }
    }> {
        const assetIds: { [impl: string]: number } = {}
        const stargateImpls: { [asset: number]: string } = {}
        const limit = await this.tokenMessagingContract.maxAssetId()

        // sanity check
        if (limit > 200) {
            this.logger.warn(
                `maxAssetId in stargate token messaging contract ${this.tokenMessagingContract.address} on chain ${this.options.chainName} is set to ${limit}, too high a value`
            )
        }

        const assets = Array.from({ length: limit }, (_, i) => i + 1)

        const callbacks = assets.map((assetId: number) => async () => {
            const impl = await this.tokenMessagingContract.stargateImpls(assetId)

            if (!impl || impl === constants.AddressZero) {
                return
            }

            stargateImpls[assetId] = impl
            assetIds[impl] = assetId
        })

        await parallelProcess(callbacks, 10)

        return { assetIds, stargateImpls }
    }
}
