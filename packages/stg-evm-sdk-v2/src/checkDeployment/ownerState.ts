import { DEFAULT_PLANNER } from '@stargatefinance/stg-evm-v2/devtools/config/mainnet/01/constants'

import { isStargateV2SupportedChainName, processPromises, retryWithBackoff } from '../common-utils'
import { getBootstrapChainConfigFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../config'
import {
    FeeLibV1__factory,
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

    await processPromises(
        'OWNER STATE CHECK',
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

                // Get asset symbol from the pool info
                const assetSymbol = config.poolInfo[chainName].token.symbol

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
                                ownerState[assetId][chainName].tokenMessaging = ownerAddress
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].tokenMessaging = isOwnerEOA
                                ? `error: TokenMessaging EOA ${ownerAddress.slice(0, 8)}...`
                                : ''
                        } catch (error) {
                            ownerState[assetId][chainName].tokenMessaging = `TokenMessaging not deployed`
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
                                ownerState[assetId][chainName].creditMessaging = ownerAddress
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].creditMessaging = isOwnerEOA
                                ? `error: CreditMessaging EOA ${ownerAddress.slice(0, 8)}...`
                                : ''
                        } catch (error) {
                            ownerState[assetId][chainName].creditMessaging = `CreditMessaging not deployed`
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
                                ownerState[assetId][chainName].stargateStaking = ownerAddress
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].stargateStaking = isOwnerEOA
                                ? `error: StargateStaking EOA ${ownerAddress.slice(0, 8)}...`
                                : ''
                        } catch (error) {
                            ownerState[assetId][chainName].stargateStaking = `StargateStaking not deployed`
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
                                ownerState[assetId][chainName].oftWrapper = ownerAddress
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].oftWrapper = isOwnerEOA
                                ? `error: OFTWrapper EOA ${ownerAddress.slice(0, 8)}...`
                                : ''
                        } catch (error) {
                            ownerState[assetId][chainName].oftWrapper = `OFTWrapper not deployed`
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
                                ownerState[assetId][chainName].stargateMultiRewarder = ownerAddress
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].stargateMultiRewarder = isOwnerEOA
                                ? `error: StargateMultiRewarder EOA ${ownerAddress.slice(0, 8)}...`
                                : ''
                        } catch (error) {
                            ownerState[assetId][chainName].stargateMultiRewarder = `StargateMultiRewarder not deployed`
                        }
                    },

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
                                ownerState[assetId][chainName].feeLib = ownerAddress
                                return
                            }

                            // FeeLib should be owned by the DEFAULT_PLANNER
                            const isCorrectOwner = ownerAddress.toLowerCase() === DEFAULT_PLANNER.toLowerCase()
                            ownerState[assetId][chainName].feeLib = isCorrectOwner
                                ? ''
                                : `error: FeeLib owned by ${ownerAddress.slice(0, 8)}... (expected ${DEFAULT_PLANNER.slice(0, 8)}...)`
                        } catch (error) {
                            ownerState[assetId][chainName].feeLib = `FeeLib not accessible`
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
                                ownerState[assetId][chainName].stargateContract = ownerAddress
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].stargateContract = isOwnerEOA
                                ? `error: Stargate${stargateType} EOA ${ownerAddress.slice(0, 8)}...`
                                : ''
                        } catch (error) {
                            ownerState[assetId][chainName].stargateContract = `Stargate contract not accessible`
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
                                ownerState[assetId][chainName].treasurer = ownerAddress
                                return
                            }

                            const isOwnerEOA = await isEOA(bootstrapChainConfig.providers[chainName], ownerAddress)
                            ownerState[assetId][chainName].treasurer = isOwnerEOA
                                ? `error: Treasurer EOA ${ownerAddress.slice(0, 8)}...`
                                : ''
                        } catch (error) {
                            ownerState[assetId][chainName].treasurer = `Treasurer not deployed`
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

        printByAssetFlattenConfig('OWNER STATE CHECK', await getOwnerState(args), args.onlyError)
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
