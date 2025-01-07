import { EndpointVersion } from '@layerzerolabs/lz-definitions'

import {
    getBootstrapChainConfigWithUlnFromArgs,
    getLocalStargatePlannerConfigGetterFromArgs,
    getLocalStargatePoolConfigGetterFromArgs,
} from '@monorepo/args-bootstrap-config'
import {
    getStargateV2TokenMessagingContract,
    isStargateV2SupportedChainName,
} from '@monorepo/stargate-v2-contracts'
import { getChainIdForEndpointVersion } from '@monorepo/static-config'

import {
    ByAssetPathConfig,
    StargateVersion,
    errorString,
    printByPathAndAssetFlattenConfig,
    processPromises,
    timeoutString,
    valueOrTimeout,
} from './utils'

export const getQuotesState = async (args: {
    environment: string
    only: string
    targets: string
}) => {
    const { environment, only, targets: targetsString } = args
    const targets = targetsString.split(',')
    const service = 'stargate'

    const bootstrapChainConfig = await getBootstrapChainConfigWithUlnFromArgs(
        service,
        {
            environment,
            noFork: true,
            only,
        },
        isStargateV2SupportedChainName,
    )

    const stargatePoolConfigGetter =
        await getLocalStargatePoolConfigGetterFromArgs(environment)

    const poolsConfig =
        stargatePoolConfigGetter.getPoolsConfig()[StargateVersion.V2]

    const stargatePlannerConfigGetter =
        await getLocalStargatePlannerConfigGetterFromArgs(environment)

    const quotesState: ByAssetPathConfig = {}

    await processPromises(
        'QUOTES STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter(
                (chainName) =>
                    bootstrapChainConfig.chainNames.includes(chainName),
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

                                const toChainId = getChainIdForEndpointVersion(
                                    toChainName,
                                    environment,
                                    EndpointVersion.V2,
                                )

                                const tokenMessagingContract =
                                    getStargateV2TokenMessagingContract(
                                        fromChainName,
                                        environment,
                                        bootstrapChainConfig.providers[
                                            fromChainName
                                        ],
                                    )

                                // Try to quote with the maxNumPassengers to make sure it succeeds
                                const maxNumPassengers: number = (
                                    await tokenMessagingContract.busQueues(
                                        toChainId,
                                    )
                                ).maxNumPassengers

                                const [busFare, busFareWithNativeDrop] =
                                    await valueOrTimeout(
                                        () =>
                                            tokenMessagingContract.quoteFares(
                                                toChainId,
                                                maxNumPassengers,
                                            ),
                                        [errorString, errorString],
                                        [timeoutString, timeoutString],
                                    )

                                quotesState[assetId][fromChainName][
                                    toChainName
                                ] = {
                                    busFare: busFare.toString(),
                                    busFareWithNativeDrop:
                                        busFareWithNativeDrop.toString(),
                                }
                            }
                        }),
                ]
            })
        }),
    )

    return quotesState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('@monorepo/args')

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
            },
        })

        printByPathAndAssetFlattenConfig(
            'QUOTES STATE',
            await getQuotesState(args),
        )
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
