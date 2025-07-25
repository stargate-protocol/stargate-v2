import { JsonRpcProvider } from '@ethersproject/providers'
import { constants } from 'ethers'

import { IToken, StargatePoolConfigGetter } from '../bootstrap-config'
import { StargateVersion, parallelProcess } from '../checkDeployment/utils'
import { ERC20__factory } from '../openzeppelin-contracts'
import {
    CreditMessaging,
    ERC20Token,
    ERC20Token__factory,
    FeeLibV1,
    FeeLibV1__factory,
    LPToken__factory,
    OFTSentEvent,
    StargateBase__factory,
    StargateContract,
    StargateContractType,
    StargateMultiRewarder__factory,
    StargateOFT,
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
import { StaticChainConfigs } from '../stargate-contracts/utils'

import { ContractMetadata, StargateV2OFTSentEvent, StargateV2Sdk } from './model'
import { staticConfig } from './staticConfig'
import { convertLogToEvent, extractOFTSentEvent, isOfEventType } from './utils'

import type { Logger } from 'winston'

export class StargateV2EvmSdk implements StargateV2Sdk {
    protected tokenMessagingContract: TokenMessaging
    protected creditMessagingContract: CreditMessaging
    protected logger: Logger | Console

    protected tokenContracts: {
        [assetId: string]: ERC20Token
    } = {}

    protected feeLibContracts: {
        [assetId: string]: FeeLibV1
    } = {}

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

        for (const assetId of this.options.stargatePoolConfigGetter.getAssetIds(StargateVersion.V2)) {
            try {
                const poolConfig = this.options.stargatePoolConfigGetter.getPoolInfo(
                    assetId,
                    this.options.chainName,
                    StargateVersion.V2
                )

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

    // FIXME TON-POST-LAUNCH: Extract in a utility class
    public getStargateType(args: { assetId: string }): StargateTypes {
        return this.options.stargatePoolConfigGetter.getPoolInfo(
            args.assetId,
            this.options.chainName,
            StargateVersion.V2
        ).stargateType
    }

    protected async fetchTokenAddress(args: { assetId: string }): Promise<string> {
        const { assetId } = args

        const stargate = this.getStargateContractByAssetId(assetId)
        const tokenAddress = await stargate.token()

        return tokenAddress
    }

    // FIXME TON-POST-LAUNCH: Extract in a utility class
    public async getTokenContract(args: { assetId: string }): Promise<ERC20Token> {
        const assetId = args.assetId

        if (
            this.options.stargatePoolConfigGetter.getPoolInfo(args.assetId, this.options.chainName, StargateVersion.V2)
                .stargateType === StargateTypes.NATIVE
        ) {
            throw new Error('Native stargate does not have a token contract')
        }

        if (!this.tokenContracts[assetId]) {
            const tokenAddress = await this.fetchTokenAddress(args)

            this.tokenContracts[assetId] = ERC20Token__factory.connect(tokenAddress, this.options.provider)
        }

        return this.tokenContracts[assetId]
    }

    protected async fetchFeeLibAddress(args: { assetId: string }) {
        const { assetId } = args
        const stargate = this.getStargateContractByAssetId(assetId)
        const { feeLib } = await stargate.getAddressConfig()
        return feeLib
    }

    protected async getFeeLibContract(args: { assetId: string }): Promise<FeeLibV1> {
        const { assetId } = args

        if (!this.feeLibContracts[assetId]) {
            const feeLibAddress = await this.fetchFeeLibAddress(args)

            this.feeLibContracts[assetId] = FeeLibV1__factory.connect(feeLibAddress, this.options.provider)
        }

        return this.feeLibContracts[assetId]
    }

    protected getStargateContractByAddress<T extends StargateContract>(address: string) {
        if (!this.addressToContract[address]) {
            const stargateType = this.options.stargatePoolConfigGetter.getStargateTypeByAddress(
                this.options.chainName,
                address
            )

            this.addressToContract[address] = connectStargateV2Contract(this.options.provider, stargateType, address)
        }

        return this.addressToContract[address] as T
    }

    public getStargateContractByAssetId<T extends StargateContract>(assetId: string): T {
        const info = this.options.stargatePoolConfigGetter.getPoolInfo(
            assetId,
            this.options.chainName,
            StargateVersion.V2
        )
        return this.getStargateContractByAddress<T>(info.address)
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
            const { decimals, symbol } = staticConfig[this.options.chainName]

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
                                    decimals: StaticChainConfigs.getDecimals(chainName),
                                    symbol: StaticChainConfigs.getSymbol(chainName),
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

    /**
     * Retrieves the total value locked (TVL) for a given Stargate pool address.
     * @param pool The address of the Stargate pool as a string.
     * @returns The TVL.
     */
    async tvl(pool: string): Promise<string> {
        // if the pool is an oft it has no value locked
        const { stargateType } = this.options.stargatePoolConfigGetter.getPoolInfoByAddress(
            pool,
            this.options.chainName,
            StargateVersion.V2
        )
        if (stargateType === StargateTypes.OFT) return '0'
        const contract = this.getStargateContractByAddress<StargatePool>(pool)
        const tvl = await contract.tvl()
        return tvl.toString()
    }

    async tvlOrSupply(pool: string): Promise<{
        tvlOrSupply: string
        blockNumber: number
        blockTimestamp: number
    }> {
        const { stargateType } = this.options.stargatePoolConfigGetter.getPoolInfoByAddress(
            pool,
            this.options.chainName,
            StargateVersion.V2
        )
        const [tvlOrSupply, blockNumber] = await Promise.all([
            stargateType === StargateTypes.OFT ? this.totalSupply(pool) : this.tvl(pool),
            this.options.provider.getBlockNumber(),
        ])
        const { timestamp } = await this.options.provider.getBlock(blockNumber)
        return { tvlOrSupply, blockNumber, blockTimestamp: timestamp }
    }

    /**
     * Retrieves the total liquidity for a given Stargate OFT address.
     * @param oft The address of the Stargate pool as a string.
     * @returns The total liquidity.
     */
    async totalSupply(oft: string): Promise<string> {
        const { stargateType, token } = this.options.stargatePoolConfigGetter.getPoolInfoByAddress(
            oft,
            this.options.chainName,
            StargateVersion.V2
        )
        if (stargateType !== StargateTypes.OFT) {
            throw new Error('only the underlying erc20 of a stargate OFT has a totalSupply to query')
        }
        const contract = ERC20Token__factory.connect(token.address, this.options.provider)
        const totalSupply = await contract.totalSupply()
        return totalSupply.toString()
    }

    /**
     * Retrieves the single OFTSent event for a specific passenger corresponding to the provided txHash.
     * @param assetId The asset id related to the OFTContract
     * @param txHash The txHash for the passenger
     */
    public async getPassengerOFTSentEvent(args: {
        assetId: string
        txHash: string
        dstEid: number
        ticketId: string
    }): Promise<StargateV2OFTSentEvent> {
        const transactionLogs = (await this.options.provider.getTransactionReceipt(args.txHash)).logs

        const oftContract: StargateOFT = this.getStargateContractByAssetId<StargateOFT>(args.assetId)

        let busRodeEventFound = false
        for (const log of transactionLogs) {
            if (!busRodeEventFound && isOfEventType(this.tokenMessagingContract.filters.BusRode(), log)) {
                const event = convertLogToEvent(log, this.tokenMessagingContract.interface)
                if (event.args!.ticketId.toString() === args.ticketId) {
                    busRodeEventFound = true
                }
            } else if (busRodeEventFound && isOfEventType(oftContract.filters.OFTSent(), log)) {
                const event = convertLogToEvent(log, oftContract.interface)
                const oftSentEvent = extractOFTSentEvent(
                    this.options.chainName,
                    this.options.environment,
                    event as OFTSentEvent,
                    args.assetId
                )
                return oftSentEvent
            }
        }
        throw new Error(
            `OFTSent event not found for BusRodeEvent related on srcChainName: ${this.options.chainName} with args: ${args}`
        )
    }
}
