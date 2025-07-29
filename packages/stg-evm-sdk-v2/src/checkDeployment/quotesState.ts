import { Chain, EndpointVersion, Stage, chainAndStageToEndpointId } from '@layerzerolabs/lz-definitions'

import { getBootstrapChainConfigWithUlnFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../bootstrap-config'
import { isStargateV2SupportedChainName, processPromises, retryWithBackoff } from '../common-utils'
import { getStargateV2TokenMessagingContract } from '../stargate-contracts'

import {
    ByAssetPathConfig,
    errorString,
    parseTargets,
    printByPathAndAssetFlattenConfig,
    timeoutString,
    valueOrTimeout,
} from './utils'

export const getQuotesState = async (args: {
    environment: string
    only: string
    targets: string
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

    const poolsConfig = stargatePoolConfigGetter.getPoolsConfig()

    const quotesState: ByAssetPathConfig = {}

    await processPromises(
        'QUOTES STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter((chainName) =>
                bootstrapChainConfig.chainNames.includes(chainName)
            )

            quotesState[assetId] ??= {}

            return chainNames.flatMap((fromChainName) => {
                quotesState[assetId][fromChainName] ??= {}

                return [
                    ...chainNames
                        .filter((toChainName) => toChainName !== fromChainName)
                        .map((toChainName) => {
                            return async () => {
                                if (
                                    targetsString &&
                                    !targets.includes(toChainName) &&
                                    !targets.includes(fromChainName)
                                ) {
                                    return
                                }

                                const toChainId = chainAndStageToEndpointId(
                                    toChainName as Chain,
                                    environment as Stage,
                                    EndpointVersion.V2
                                ).toString()

                                const tokenMessagingContract = getStargateV2TokenMessagingContract(
                                    fromChainName,
                                    environment,
                                    bootstrapChainConfig.providers[fromChainName]
                                )

                                // Try to quote with the maxNumPassengers to make sure it succeeds
                                const busQueue = await retryWithBackoff(
                                    () => tokenMessagingContract.busQueues(toChainId),
                                    numRetries,
                                    fromChainName,
                                    `busQueues(${toChainId})`
                                )
                                const maxNumPassengers: number = busQueue.maxNumPassengers

                                const [busFare, busFareWithNativeDrop] = await valueOrTimeout(
                                    () =>
                                        retryWithBackoff(
                                            () => tokenMessagingContract.quoteFares(toChainId, maxNumPassengers),
                                            numRetries,
                                            fromChainName,
                                            `quoteFares(${toChainId}, ${maxNumPassengers})`
                                        ),
                                    [errorString, errorString],
                                    [timeoutString, timeoutString]
                                )

                                quotesState[assetId][fromChainName][toChainName] = {
                                    busFare: busFare.toString(),
                                    busFareWithNativeDrop: busFareWithNativeDrop.toString(),
                                }
                            }
                        }),
                ]
            })
        })
    )

    return quotesState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('../common-utils')

        const args = parse({
            header: 'Check Quotes State',
            description: 'Check Quotes State',
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
                numRetries: {
                    alias: 'r',
                    type: Number,
                    defaultValue: 3,
                    description: 'Number of retries for RPC calls before giving up',
                },
            },
        })

        printByPathAndAssetFlattenConfig('QUOTES STATE', await getQuotesState(args))
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
