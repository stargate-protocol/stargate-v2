import * as fs from 'fs'
import * as path from 'path'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { DEFAULT_PLANNER } from '@stargatefinance/stg-evm-v2/devtools/config/mainnet/01/constants'
import { getAssetNetworkConfig } from '@stargatefinance/stg-evm-v2/ts-src/utils/util'

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

const isEOA = async (provider: any, address: string): Promise<boolean> => {
    try {
        const code = await provider.getCode(address)
        return code === '0x' || code === '0x0'
    } catch (error) {
        console.error(`Error checking if address ${address} is EOA:`, error)
        return false
    }
}

/**
 * Helper function to check if a token contract deployment exists
 */
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

/**
 * Helper function to get chain eid from chain name
 */
const getChainEid = (chainName: string, environment = 'mainnet'): number | null => {
    try {
        // networkToEndpointId expects format like "botanix-mainnet", not just "botanix"
        const networkName = `${chainName}-${environment}`
        return networkToEndpointId(networkName, EndpointVersion.V2)
    } catch (error) {
        return null
    }
}

/**
 * Helper function to get external token address if it exists
 */
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

/**
 * Check that all Stargate contracts are not owned by EOAs
 */
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

    // First, check chain-wide contracts once per chain
    const chainWideState: Record<string, any> = {}

    await processPromises(
        'CHAIN-WIDE OWNER STATE CHECK',
        bootstrapChainConfig.chainNames.flatMap((chainName) => {
            if (targetsString && !targets.includes(chainName)) {
                return []
            }

            chainWideState[chainName] = {}

            return [
                async () => {
                    try {
                        const tokenMessagingContract = getStargateV2TokenMessagingContract(
                            chainName,
                            environment,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => tokenMessagingContract.owner(),
                                    numRetries,
                                    chainName,
                                    'TokenMessaging.owner()'
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].tokenMessaging = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].tokenMessaging = isOwnerEOA
                            ? `error: EOA ${ownerAddress}`
                            : `OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].tokenMessaging = `TokenMessaging not deployed`
                    }
                },

                async () => {
                    try {
                        const creditMessagingContract = getStargateV2CreditMessagingContract(
                            chainName,
                            environment,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => creditMessagingContract.owner(),
                                    numRetries,
                                    chainName,
                                    'CreditMessaging.owner()'
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].creditMessaging = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].creditMessaging = isOwnerEOA
                            ? `error: EOA ${ownerAddress}`
                            : `OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].creditMessaging = `CreditMessaging not deployed`
                    }
                },

                async () => {
                    try {
                        const stakingContract = getStargateV2StargateStakingContract(
                            chainName,
                            environment,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => stakingContract.owner(),
                                    numRetries,
                                    chainName,
                                    'StargateStaking.owner()'
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].stargateStaking = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].stargateStaking = isOwnerEOA
                            ? `error: EOA ${ownerAddress}`
                            : `OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].stargateStaking = `StargateStaking not deployed`
                    }
                },

                async () => {
                    try {
                        const oftWrapperContract = getStargateV2OFTWrapperContract(
                            chainName,
                            environment,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => oftWrapperContract.owner(),
                                    numRetries,
                                    chainName,
                                    'OFTWrapper.owner()'
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].oftWrapper = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].oftWrapper = isOwnerEOA
                            ? `error: EOA ${ownerAddress}`
                            : `OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].oftWrapper = `OFTWrapper not deployed`
                    }
                },

                async () => {
                    try {
                        const multiRewarderContract = getStargateV2StargateMultiRewarderContract(
                            chainName,
                            environment,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => multiRewarderContract.owner(),
                                    numRetries,
                                    chainName,
                                    'StargateMultiRewarder.owner()'
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].stargateMultiRewarder = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].stargateMultiRewarder = isOwnerEOA
                            ? `error: EOA ${ownerAddress}`
                            : `OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].stargateMultiRewarder = `StargateMultiRewarder not deployed`
                    }
                },

                async () => {
                    try {
                        const treasurerContract = getStargateV2TreasurerContract(
                            chainName,
                            environment,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => treasurerContract.owner(),
                                    numRetries,
                                    chainName,
                                    'Treasurer.owner()'
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].treasurer = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].treasurer = isOwnerEOA
                            ? `error: EOA ${ownerAddress}`
                            : `OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].treasurer = `Treasurer not deployed`
                    }
                },

                // Check OFT Token contract if it exists (chain-wide)
                async () => {
                    const oftTokenName = `OFTTokenETH`
                    const tokenAddress = getTokenContractAddress(chainName, environment, oftTokenName)

                    if (!tokenAddress) {
                        chainWideState[chainName].oftToken = `No internal ${oftTokenName} deployment`
                        return
                    }

                    try {
                        const oftTokenContract = OFTTokenERC20__factory.connect(
                            tokenAddress,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => oftTokenContract.owner(),
                                    numRetries,
                                    chainName,
                                    `${oftTokenName}.owner()`
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].oftToken = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].oftToken = isOwnerEOA
                            ? `error: EOA ${ownerAddress}`
                            : `OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].oftToken = `${oftTokenName} not accessible`
                    }
                },

                // Check USDC Token contract (internal deployment or external, chain-wide)
                // Only check external USDC if the chain has OFT-type assets and no Pool-type USDC assets
                async () => {
                    // Check if this chain has any OFT-type assets
                    const hasOftAssets = Object.values(poolsConfig).some(
                        (config) => config.poolInfo[chainName]?.stargateType?.toUpperCase() === 'OFT'
                    )

                    // Check if this chain has Pool-type USDC (asset ID 1)
                    const hasUsdcPool = poolsConfig['1']?.poolInfo[chainName]?.stargateType?.toUpperCase() === 'POOL'

                    // Try internal deployment first
                    let tokenAddress = getTokenContractAddress(chainName, environment, 'USDCProxy')
                    let contractType = 'Internal USDCProxy'

                    // If no internal deployment, check for external USDC only if chain has OFT assets but no USDC pools
                    if (!tokenAddress && hasOftAssets && !hasUsdcPool) {
                        tokenAddress = getExternalTokenAddress(chainName, TokenName.USDC, environment)
                        contractType = 'External USDC'
                    }

                    if (!tokenAddress) {
                        let reason = 'No internal USDCProxy found'
                        if (!hasOftAssets) {
                            reason += ' (external check skipped - no OFT assets)'
                        } else if (hasUsdcPool) {
                            reason += ' (external check skipped - chain has USDC Pool)'
                        } else {
                            reason += ' and no external USDC found'
                        }
                        chainWideState[chainName].usdcToken = reason
                        return
                    }

                    try {
                        const usdcContract = FiatTokenV2_2__factory.connect(
                            tokenAddress,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => usdcContract.owner(),
                                    numRetries,
                                    chainName,
                                    `${contractType}.owner()`
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].usdcToken = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].usdcToken = isOwnerEOA
                            ? `error: ${contractType} EOA ${ownerAddress}`
                            : `${contractType} OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].usdcToken = `${contractType} not accessible`
                    }
                },

                // Check USDT Token contract (internal deployment or external, chain-wide)
                // Only check external USDT if the chain has OFT-type assets and no Pool-type USDT assets
                async () => {
                    // Check if this chain has any OFT-type assets
                    const hasOftAssets = Object.values(poolsConfig).some(
                        (config) => config.poolInfo[chainName]?.stargateType?.toUpperCase() === 'OFT'
                    )

                    // Check if this chain has Pool-type USDT (asset ID 2)
                    const hasUsdtPool = poolsConfig['2']?.poolInfo[chainName]?.stargateType?.toUpperCase() === 'POOL'

                    // Try internal deployment first
                    let tokenAddress = getTokenContractAddress(chainName, environment, 'USDT')
                    let contractType = 'Internal USDT'

                    // If no internal deployment, check for external USDT only if chain has OFT assets but no USDT pools
                    if (!tokenAddress && hasOftAssets && !hasUsdtPool) {
                        tokenAddress = getExternalTokenAddress(chainName, TokenName.USDT, environment)
                        contractType = 'External USDT'
                    }

                    if (!tokenAddress) {
                        let reason = 'No internal USDT found'
                        if (!hasOftAssets) {
                            reason += ' (external check skipped - no OFT assets)'
                        } else if (hasUsdtPool) {
                            reason += ' (external check skipped - chain has USDT Pool)'
                        } else {
                            reason += ' and no external USDT found'
                        }
                        chainWideState[chainName].usdtToken = reason
                        return
                    }

                    try {
                        // Use USDT factory for both internal and external USDT tokens
                        const usdtContract = USDT__factory.connect(
                            tokenAddress,
                            bootstrapChainConfig.providers[chainName]
                        )

                        const ownerAddress = await valueOrTimeout(
                            () =>
                                retryWithBackoff(
                                    () => usdtContract.owner(),
                                    numRetries,
                                    chainName,
                                    `${contractType}.owner()`
                                ),
                            errorString,
                            timeoutString
                        )

                        if (
                            typeof ownerAddress === 'string' &&
                            (ownerAddress === errorString || ownerAddress === timeoutString)
                        ) {
                            chainWideState[chainName].usdtToken = ownerAddress
                            return
                        }

                        const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                        chainWideState[chainName].usdtToken = isOwnerEOA
                            ? `error: ${contractType} EOA ${ownerAddress}`
                            : `${contractType} OK (owner: ${ownerAddress})`
                    } catch (error) {
                        chainWideState[chainName].usdtToken = `${contractType} not accessible`
                    }
                },
            ]
        })
    )

    // Now check asset-specific contracts (FeeLib and StargateContract)
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

                // Get asset symbol from the pool info
                const assetSymbol = config.poolInfo[chainName].token.symbol

                return [
                    // Check FeeLib contract for this specific asset is owned by the DEFAULT_PLANNER
                    async () => {
                        try {
                            const { stargateType, address } = config.poolInfo[chainName]
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

                            const feeLibContract = FeeLibV1__factory.connect(
                                feeLib,
                                bootstrapChainConfig.providers[chainName]
                            )

                            const ownerAddress = await valueOrTimeout(
                                () =>
                                    retryWithBackoff(
                                        () => feeLibContract.owner(),
                                        numRetries,
                                        chainName,
                                        `FeeLib_${assetSymbol}.owner()`
                                    ),
                                errorString,
                                timeoutString
                            )

                            if (
                                typeof ownerAddress === 'string' &&
                                (ownerAddress === errorString || ownerAddress === timeoutString)
                            ) {
                                ownerState[assetId][chainName].feeLib = `FeeLib_${assetSymbol} ${ownerAddress}`
                                return
                            }

                            // FeeLib should be owned by the DEFAULT_PLANNER
                            const isCorrectOwner = ownerAddress.toLowerCase() === DEFAULT_PLANNER.toLowerCase()
                            ownerState[assetId][chainName].feeLib = isCorrectOwner
                                ? `FeeLib_${assetSymbol} OK (owner: DEFAULT_PLANNER ${ownerAddress})`
                                : `error: FeeLib_${assetSymbol} owned by ${ownerAddress} (expected ${DEFAULT_PLANNER})`
                        } catch (error) {
                            ownerState[assetId][chainName].feeLib = `FeeLib_${assetSymbol} not accessible`
                        }
                    },

                    // Check Stargate Pool/OFT contract for this specific asset
                    async () => {
                        try {
                            const { stargateType, address } = config.poolInfo[chainName]

                            const stargateContract = connectStargateV2Contract(
                                bootstrapChainConfig.providers[chainName],
                                stargateType,
                                address
                            )

                            const ownerAddress = await valueOrTimeout(
                                () =>
                                    retryWithBackoff(
                                        () => stargateContract.owner(),
                                        numRetries,
                                        chainName,
                                        `Stargate${stargateType}_${assetSymbol}.owner()`
                                    ),
                                errorString,
                                timeoutString
                            )

                            if (
                                typeof ownerAddress === 'string' &&
                                (ownerAddress === errorString || ownerAddress === timeoutString)
                            ) {
                                ownerState[assetId][chainName].stargateContract =
                                    `Stargate${stargateType}_${assetSymbol} ${ownerAddress}`
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].stargateContract = isOwnerEOA
                                ? `error: Stargate${stargateType}_${assetSymbol} EOA ${ownerAddress}`
                                : `Stargate${stargateType}_${assetSymbol} OK (owner: ${ownerAddress})`
                        } catch (error) {
                            ownerState[assetId][chainName].stargateContract =
                                `Stargate${stargateType}_${assetSymbol} not accessible`
                        }
                    },
                ]
            })
        })
    )

    return ownerState
}

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
