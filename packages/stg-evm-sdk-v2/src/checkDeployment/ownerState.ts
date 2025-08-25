import * as fs from 'fs'
import * as path from 'path'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { DEFAULT_PLANNER } from '@stargatefinance/stg-evm-v2/devtools/config/mainnet/01/constants'
import { getAssetNetworkConfig } from '@stargatefinance/stg-evm-v2/ts-src/utils/util'
import { ethers } from 'ethers'

import { EndpointVersion, networkToEndpointId } from '@layerzerolabs/lz-definitions'

import { isStargateV2SupportedChainName, processPromises, retryWithBackoff } from '../common-utils'
import { getBootstrapChainConfigFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../config'
import {
    FeeLibV1__factory,
    FiatTokenV2_2__factory,
    OFTTokenERC20__factory,
    USDT__factory,
    connectStargateV2Contract,
    getStargateV2CreditMessagingContract,
    getStargateV2OFTWrapperContract,
    getStargateV2StargateMultiRewarderContract,
    getStargateV2StargateStakingContract,
    getStargateV2TokenMessagingContract,
    getStargateV2TreasurerContract,
} from '../stargate-contracts'

import {
    ByAssetConfig,
    errorString,
    parseTargets,
    printByAssetFlattenConfig,
    timeoutString,
    valueOrTimeout,
} from './utils'

const isEOA = async (provider: ethers.providers.Provider, address: string): Promise<boolean> => {
    try {
        const code = await provider.getCode(address)
        return code === '0x' || code === '0x0'
    } catch (error) {
        console.error(`Error checking if address ${address} is EOA:`, error)
        return false
    }
}

const checkContractOwnership = async (params: {
    chainName: string
    contractName: string
    getContract: () => Promise<{ owner: () => Promise<string> }>
    expectedOwner?: string
    numRetries: number
    provider: ethers.providers.Provider
}): Promise<string> => {
    const { chainName, contractName, getContract, expectedOwner, numRetries, provider } = params

    try {
        const contract = await getContract()
        const ownerAddress = await valueOrTimeout(
            () => retryWithBackoff(() => contract.owner(), numRetries, chainName, `${contractName}.owner()`),
            errorString,
            timeoutString
        )

        if (typeof ownerAddress === 'string' && (ownerAddress === errorString || ownerAddress === timeoutString)) {
            return ownerAddress
        }

        if (expectedOwner) {
            const isCorrectOwner = (ownerAddress as string).toLowerCase() === expectedOwner.toLowerCase()
            return isCorrectOwner
                ? `OK (owner: DEFAULT_PLANNER ${ownerAddress})`
                : `error: ${contractName} owned by ${ownerAddress} (expected ${expectedOwner})`
        }

        const isOwnerEOA = await isEOA(provider, ownerAddress as string)
        return isOwnerEOA ? `error: EOA ${ownerAddress}` : `OK (owner: ${ownerAddress})`
    } catch (error) {
        return `${contractName} not deployed`
    }
}

const checkTokenContract = async (params: {
    chainName: string
    environment: string
    tokenConfig: {
        name: string
        internalName: string
        externalTokenName: TokenName
        factory: { connect: (address: string, provider: ethers.providers.Provider) => { owner: () => Promise<string> } }
        poolAssetId: string
    }
    poolsConfig: Record<string, { poolInfo: Record<string, { stargateType: string }> }>
    numRetries: number
    provider: ethers.providers.Provider
}): Promise<string> => {
    const { chainName, environment, tokenConfig, poolsConfig, numRetries, provider } = params
    const { name, internalName, externalTokenName, factory, poolAssetId } = tokenConfig

    // Only check ownership of external tokens if there are OFT assets on the chain
    const hasOftAssets = Object.values(poolsConfig).some(
        (config) => config.poolInfo[chainName]?.stargateType?.toUpperCase() === 'OFT'
    )
    const hasPool = poolsConfig[poolAssetId]?.poolInfo[chainName]?.stargateType?.toUpperCase() === 'POOL'

    // Check for internal deployment first
    let tokenAddress = getTokenContractAddress(chainName, environment, internalName)
    let contractType = `Internal ${internalName}`

    if (!tokenAddress && hasOftAssets && !hasPool) {
        tokenAddress = getExternalTokenAddress(chainName, externalTokenName, environment)
        contractType = `External ${name.toUpperCase()}`
    }

    if (!tokenAddress) {
        if (!hasOftAssets) {
            return `No internal ${internalName} found (external check skipped - no OFT assets)`
        } else if (hasPool) {
            return `No internal ${internalName} found (external check skipped - chain has ${name.toUpperCase()} Pool)`
        } else {
            return `No internal ${internalName} found and no external ${name.toUpperCase()} found`
        }
    }

    try {
        const tokenContract = factory.connect(tokenAddress, provider)
        const ownerAddress = await valueOrTimeout(
            () => retryWithBackoff(() => tokenContract.owner(), numRetries, chainName, `${contractType}.owner()`),
            errorString,
            timeoutString
        )

        if (typeof ownerAddress === 'string' && (ownerAddress === errorString || ownerAddress === timeoutString)) {
            return ownerAddress
        }

        const isOwnerEOA = await isEOA(provider, ownerAddress as string)
        return isOwnerEOA ? `error: ${contractType} EOA ${ownerAddress}` : `${contractType} OK (owner: ${ownerAddress})`
    } catch (error) {
        return `${contractType} not accessible`
    }
}

const getTokenContractAddress = (chainName: string, environment: string, contractName: string): string | null => {
    try {
        const deploymentPath = path.join(
            __dirname,
            '..',
            '..',
            'deployments',
            `${chainName}-${environment}`,
            `${contractName}.json`
        )

        if (fs.existsSync(deploymentPath)) {
            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
            return deployment.address
        }
        return null
    } catch (error) {
        return null
    }
}

const getChainEid = (chainName: string, environment = 'mainnet'): number | null => {
    try {
        const networkName = `${chainName}-${environment}`
        return networkToEndpointId(networkName, EndpointVersion.V2)
    } catch (error) {
        return null
    }
}

const getExternalTokenAddress = (chainName: string, tokenName: TokenName, environment = 'mainnet'): string | null => {
    try {
        const eid = getChainEid(chainName, environment)
        if (!eid) return null

        const assetConfig = getAssetNetworkConfig(eid, tokenName)
        return assetConfig?.address || null
    } catch (error) {
        return null
    }
}

const CHAIN_WIDE_CONTRACTS = [
    {
        key: 'tokenMessaging',
        name: 'TokenMessaging',
        getContract: (chainName: string, environment: string, provider: ethers.providers.Provider) =>
            getStargateV2TokenMessagingContract(chainName, environment, provider),
    },
    {
        key: 'creditMessaging',
        name: 'CreditMessaging',
        getContract: (chainName: string, environment: string, provider: ethers.providers.Provider) =>
            getStargateV2CreditMessagingContract(chainName, environment, provider),
    },
    {
        key: 'stargateStaking',
        name: 'StargateStaking',
        getContract: (chainName: string, environment: string, provider: ethers.providers.Provider) =>
            getStargateV2StargateStakingContract(chainName, environment, provider),
    },
    {
        key: 'oftWrapper',
        name: 'OFTWrapper',
        getContract: (chainName: string, environment: string, provider: ethers.providers.Provider) =>
            getStargateV2OFTWrapperContract(chainName, environment, provider),
    },
    {
        key: 'stargateMultiRewarder',
        name: 'StargateMultiRewarder',
        getContract: (chainName: string, environment: string, provider: ethers.providers.Provider) =>
            getStargateV2StargateMultiRewarderContract(chainName, environment, provider),
    },
    {
        key: 'treasurer',
        name: 'Treasurer',
        getContract: (chainName: string, environment: string, provider: ethers.providers.Provider) =>
            getStargateV2TreasurerContract(chainName, environment, provider),
    },
]

const TOKEN_CONTRACTS = [
    {
        key: 'oftToken',
        name: 'oft',
        internalName: 'OFTTokenETH',
        externalTokenName: TokenName.USDC,
        factory: OFTTokenERC20__factory,
        poolAssetId: '',
        isOftOnly: true,
    },
    {
        key: 'usdcToken',
        name: 'usdc',
        internalName: 'USDCProxy',
        externalTokenName: TokenName.USDC,
        factory: FiatTokenV2_2__factory,
        poolAssetId: '1',
        isOftOnly: false,
    },
    {
        key: 'usdtToken',
        name: 'usdt',
        internalName: 'USDT',
        externalTokenName: TokenName.USDT,
        factory: USDT__factory,
        poolAssetId: '2',
        isOftOnly: false,
    },
]

export const getOwnerState = async (args: {
    environment: string
    only: string
    targets: string
    numRetries?: number
}) => {
    const { environment, only, targets: targetsString, numRetries = 3 } = args
    const targets = parseTargets(targetsString)

    const bootstrapChainConfig = await getBootstrapChainConfigFromArgs(
        {
            environment,
            only,
        },
        isStargateV2SupportedChainName
    )

    const stargatePoolConfigGetter = await getLocalStargatePoolConfigGetterFromArgs(environment)
    const poolsConfig = stargatePoolConfigGetter.getPoolsConfig()

    const ownerState: ByAssetConfig = {}

    const chainWideState: Record<string, Record<string, string>> = {}

    await processPromises(
        'CHAIN-WIDE OWNER STATE CHECK',
        bootstrapChainConfig.chainNames.flatMap((chainName) => {
            if (targetsString && !targets.includes(chainName)) {
                return []
            }

            chainWideState[chainName] = {}

            return [
                ...CHAIN_WIDE_CONTRACTS.map((contractConfig) => async () => {
                    chainWideState[chainName][contractConfig.key] = await checkContractOwnership({
                        chainName,
                        contractName: contractConfig.name,
                        getContract: () =>
                            Promise.resolve(
                                contractConfig.getContract(
                                    chainName,
                                    environment,
                                    bootstrapChainConfig.providers[chainName]
                                )
                            ),
                        numRetries,
                        provider: bootstrapChainConfig.providers[chainName],
                    })
                }),

                ...TOKEN_CONTRACTS.map((tokenConfig) => async () => {
                    if (tokenConfig.isOftOnly) {
                        const tokenAddress = getTokenContractAddress(chainName, environment, tokenConfig.internalName)
                        if (!tokenAddress) {
                            chainWideState[chainName][tokenConfig.key] =
                                `No internal ${tokenConfig.internalName} deployment`
                            return
                        }

                        chainWideState[chainName][tokenConfig.key] = await checkContractOwnership({
                            chainName,
                            contractName: tokenConfig.internalName,
                            getContract: () =>
                                Promise.resolve(
                                    tokenConfig.factory.connect(tokenAddress, bootstrapChainConfig.providers[chainName])
                                ),
                            numRetries,
                            provider: bootstrapChainConfig.providers[chainName],
                        })
                    } else {
                        chainWideState[chainName][tokenConfig.key] = await checkTokenContract({
                            chainName,
                            environment,
                            tokenConfig,
                            poolsConfig,
                            numRetries,
                            provider: bootstrapChainConfig.providers[chainName],
                        })
                    }
                }),
            ]
        })
    )

    await processPromises(
        'ASSET-SPECIFIC OWNER STATE CHECK',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter((chainName) =>
                bootstrapChainConfig.chainNames.includes(chainName)
            )

            ownerState[assetId] ??= {}

            return chainNames.flatMap((chainName) => {
                if (targetsString && !targets.includes(chainName)) {
                    return []
                }

                ownerState[assetId][chainName] ??= {}
                Object.assign(ownerState[assetId][chainName], chainWideState[chainName])

                const { stargateType, address } = config.poolInfo[chainName]
                const assetSymbol = config.poolInfo[chainName].token.symbol

                return [
                    // Check FeeLib contract for this specific asset (should be owned by DEFAULT_PLANNER)
                    async () => {
                        ownerState[assetId][chainName].feeLib = await checkContractOwnership({
                            chainName,
                            contractName: `FeeLib_${assetSymbol}`,
                            getContract: async () => {
                                const stargateContract = connectStargateV2Contract(
                                    bootstrapChainConfig.providers[chainName],
                                    stargateType,
                                    address
                                )
                                const { feeLib } = await retryWithBackoff(
                                    () => stargateContract.getAddressConfig(),
                                    numRetries,
                                    chainName,
                                    `getAddressConfig(${assetSymbol})`
                                )
                                return FeeLibV1__factory.connect(feeLib, bootstrapChainConfig.providers[chainName])
                            },
                            expectedOwner: DEFAULT_PLANNER,
                            numRetries,
                            provider: bootstrapChainConfig.providers[chainName],
                        })
                    },

                    // Check Stargate Pool/OFT contract for this specific asset
                    async () => {
                        ownerState[assetId][chainName].stargateContract = await checkContractOwnership({
                            chainName,
                            contractName: `Stargate${stargateType}_${assetSymbol}`,
                            getContract: () =>
                                Promise.resolve(
                                    connectStargateV2Contract(
                                        bootstrapChainConfig.providers[chainName],
                                        stargateType,
                                        address
                                    )
                                ),
                            numRetries,
                            provider: bootstrapChainConfig.providers[chainName],
                        })
                    },
                ]
            })
        })
    )

    return ownerState
}

/**
 * Check that all Stargate contracts are not owned by EOAs
 */
if (require.main === module) {
    const main = async () => {
        const { parse } = await import('../common-utils')

        const args = parse({
            header: 'Check Owner State',
            description: 'Check that all Stargate contracts are not owned by EOAs',
            args: {
                environment: {
                    alias: 'e',
                    type: String,
                    defaultValue: 'mainnet',
                    description: 'the environment',
                },
                only: {
                    alias: 'o',
                    type: String,
                    defaultValue: '',
                    description: 'chain name to check',
                },
                targets: {
                    alias: 't',
                    type: String,
                    defaultValue: '',
                    description: 'chain names to check against',
                },
                numRetries: {
                    alias: 'r',
                    type: Number,
                    defaultValue: 3,
                    description: 'Number of retries for RPC calls before giving up',
                },
                onlyError: {
                    type: Boolean,
                    defaultValue: false,
                    description: 'only print rows with errors',
                },
            },
        })

        printByAssetFlattenConfig('OWNER STATE', await getOwnerState(args), args.onlyError)
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
