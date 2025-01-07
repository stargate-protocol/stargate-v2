import { EndpointVersion } from '@layerzerolabs/lz-definitions'

import {
    getBootstrapChainConfigWithUlnFromArgs,
    getLocalStargatePoolConfigGetterFromArgs,
} from '@monorepo/args-bootstrap-config'
import {
    connectStargateV2Contract,
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

export const getCreditsState = async (args: {
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

    const creditsState: ByAssetPathConfig = {}

    await processPromises(
        'CREDITS STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter(
                (chainName) =>
                    bootstrapChainConfig.chainNames.includes(chainName),
            )

            creditsState[assetId] ??= {}

            return chainNames.flatMap((srcChainName) => {
                creditsState[assetId][srcChainName] ??= {}

                return [
                    ...chainNames.map((chainName) => {
                        return async () => {
                            if (
                                targetsString &&
                                !targets.includes(srcChainName) &&
                                !targets.includes(chainName)
                            ) {
                                return
                            }

                            const { stargateType, address } =
                                config.poolInfo[chainName]

                            const stargateContract = connectStargateV2Contract(
                                bootstrapChainConfig.providers[chainName],
                                stargateType,
                                address,
                            )

                            const credit = await valueOrTimeout(
                                () =>
                                    stargateContract.paths(
                                        getChainIdForEndpointVersion(
                                            srcChainName,
                                            environment,
                                            EndpointVersion.V2,
                                        ),
                                    ),
                                errorString,
                                timeoutString,
                            )

                            creditsState[assetId][srcChainName][chainName] = {
                                credit: credit.toString(),
                            }
                        }
                    }),
                ]
            })
        }),
    )

    return creditsState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('@monorepo/args')

        const args = parse({
            header: 'Check Credits State',
            description: 'Check Credits State',
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
            'CREDITS STATE',
            await getCreditsState(args),
        )
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
