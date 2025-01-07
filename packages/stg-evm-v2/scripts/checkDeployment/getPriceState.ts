import {
    getBootstrapChainConfigWithUlnFromArgs,
    getLocalStargatePlannerConfigGetterFromArgs,
    getLocalStargatePoolConfigGetterFromArgs,
} from '@monorepo/args-bootstrap-config'
import { CachedPricesSdkFactory } from '@monorepo/cached-prices-sdk'
import { Millis } from '@monorepo/common-utils'
import { isStargateV2SupportedChainName } from '@monorepo/stargate-v2-contracts'

import {
    ByAssetConfig,
    StargateVersion,
    errorString,
    printByAssetFlattenConfig,
    processPromises,
    timeoutString,
    valueOrTimeout,
} from './utils'

export const getPriceState = async (args: {
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

    const priceState: ByAssetConfig = {}

    const cachedPricesSdkFactory = new CachedPricesSdkFactory({ environment })
    const cachedPricesSdk = cachedPricesSdkFactory.getSdk()

    await processPromises(
        'PRICE STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter(
                (chainName) =>
                    bootstrapChainConfig.chainNames.includes(chainName),
            )

            priceState[assetId] ??= {}

            return chainNames.flatMap((fromChainName) => {
                priceState[assetId] ??= {}

                return [
                    ...chainNames.map((chainName) => {
                        return async () => {
                            if (targetsString && !targets.includes(chainName)) {
                                return
                            }

                            const price = await valueOrTimeout(
                                () =>
                                    cachedPricesSdk
                                        .getPriceQuoteForToken({
                                            token: {
                                                chainName,
                                                tokenAddress:
                                                    poolsConfig[assetId]
                                                        .poolInfo[chainName]
                                                        .token.address,
                                            },
                                            tolerance: {
                                                forward: Millis.from
                                                    .hours(1)
                                                    .toString(),
                                                reverse: Millis.from
                                                    .hours(1)
                                                    .toString(),
                                            },
                                            throwOnError: true,
                                        })
                                        .then(
                                            (price) =>
                                                (price as { value: number })
                                                    .value,
                                        ),
                                errorString,
                                timeoutString,
                                {
                                    numOfAttempts: 3,
                                    startingDelay: 500,
                                    timeMultiple: 2,
                                },
                            )

                            priceState[assetId][chainName] = {
                                price,
                            }
                        }
                    }),
                ]
            })
        }),
    )

    return priceState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('@monorepo/args')

        const args = parse({
            header: 'Check Price State',
            description: 'Check Price State',
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

        printByAssetFlattenConfig('PRICE STATE', await getPriceState(args))
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
