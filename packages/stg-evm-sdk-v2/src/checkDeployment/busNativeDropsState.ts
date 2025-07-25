import { BigNumber, utils } from 'ethers'

import { EndpointVersion } from '@layerzerolabs/lz-definitions'

import { getBootstrapChainConfigWithUlnFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../bootstrap-config'
import { getExecutorContract } from '../protocol-contracts'
import { getStargateV2TokenMessagingContract, isStargateV2SupportedChainName } from '../stargate-contracts'
import { retryWithBackoff } from '../utils/retry'

import {
    ByAssetPathConfig,
    StargateVersion,
    getChainIdForEndpointVersion,
    parseTargets,
    printByPathAndAssetFlattenConfig,
    processPromises,
} from './utils'

/**
 * Checks all pathways for all assets to ensure that maxBusNativeDropAmount <= executor nativeCap
 * If the bus allows for more native drops than the executor accepts, the quoteBusFares will fail on the TokenMessaging contract
 */
export const getBusNativeDropsState = async (args: {
    environment: string
    only: string
    targets: string
    onlyError?: boolean
    numRetries?: number
}) => {
    const { environment, only, targets: targetsString, numRetries = 3 } = args
    const targets = parseTargets(targetsString)
    const service = 'stargate'

    const bootstrapChainConfig = await getBootstrapChainConfigWithUlnFromArgs(
        service,
        {
            environment,
            noFork: true,
            only,
        },
        isStargateV2SupportedChainName
    )

    const stargatePoolConfigGetter = await getLocalStargatePoolConfigGetterFromArgs(environment)

    const poolsConfig = stargatePoolConfigGetter.getPoolsConfig()[StargateVersion.V2]

    const busNativeDropsState: ByAssetPathConfig = {}

    await processPromises(
        'BUS NATIVE DROPS STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter((chainName) =>
                bootstrapChainConfig.chainNames.includes(chainName)
            )

            busNativeDropsState[assetId] ??= {}

            return chainNames.flatMap((fromChainName) => {
                busNativeDropsState[assetId][fromChainName] ??= {}

                const toChainNames = chainNames.filter((toChainName) => toChainName !== fromChainName)

                return [
                    ...toChainNames.map((toChainName) => {
                        return async () => {
                            if (targetsString && !targets.includes(toChainName) && !targets.includes(fromChainName)) {
                                return
                            }

                            const tokenMessagingContract = getStargateV2TokenMessagingContract(
                                fromChainName,
                                environment,
                                bootstrapChainConfig.providers[fromChainName]
                            )
                            const executorContract = getExecutorContract(
                                fromChainName,
                                environment,
                                bootstrapChainConfig.providers[fromChainName]
                            )

                            const toChainId = getChainIdForEndpointVersion(toChainName, environment, EndpointVersion.V2)

                            // Ensure that maxNumPassengers * maxNativeDropPerPassenger <= executor nativeCap
                            // Otherwise, the quote will fail on the TokenMessaging contract
                            const busQueue = await retryWithBackoff(
                                () => tokenMessagingContract.busQueues(toChainId),
                                numRetries,
                                fromChainName,
                                `busQueues(${toChainId})`
                            )
                            const maxNumPassengers: number = busQueue.maxNumPassengers

                            const maxNativeDropPerPassenger: BigNumber = await retryWithBackoff(
                                () => tokenMessagingContract.nativeDropAmounts(toChainId),
                                numRetries,
                                fromChainName,
                                `nativeDropAmounts(${toChainId})`
                            )
                            const maxBusNativeDropAmount = maxNativeDropPerPassenger.mul(maxNumPassengers)

                            const dstConfig = await retryWithBackoff(
                                () => executorContract.dstConfig(toChainId),
                                numRetries,
                                fromChainName,
                                `dstConfig(${toChainId})`
                            )
                            const executorNativeCap = dstConfig.nativeCap

                            const error = maxBusNativeDropAmount.gt(executorNativeCap)
                                ? `error: maxBusNativeDropAmount(${utils.formatEther(
                                      maxBusNativeDropAmount
                                  )} ETH) > executorNativeCap(${utils.formatEther(executorNativeCap)} ETH)!`
                                : null

                            busNativeDropsState[assetId][fromChainName][toChainName] = {
                                maxBusNativeDropAmount: error ?? `${utils.formatEther(maxBusNativeDropAmount)} ETH`,
                                executorNativeCap: error ?? `${utils.formatEther(executorNativeCap)} ETH`,
                            }
                        }
                    }),
                ]
            })
        })
    )

    return busNativeDropsState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('./utils')

        const args = parse({
            header: 'Check Bus Native Drops State',
            description: 'Check Bus Native Drops State',
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
                    description: 'new chain names to check against',
                },
                onlyError: {
                    type: Boolean,
                    defaultValue: false,
                    description: 'only print rows with errors',
                },
                numRetries: {
                    alias: 'r',
                    type: Number,
                    defaultValue: 3,
                    description: 'Number of retries for RPC calls before giving up',
                },
            },
        })

        printByPathAndAssetFlattenConfig('BUS NATIVE DROPS STATE', await getBusNativeDropsState(args), args.onlyError)
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
