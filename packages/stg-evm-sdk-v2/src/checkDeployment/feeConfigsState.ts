import { EndpointVersion } from '@layerzerolabs/lz-definitions'

import { getBootstrapChainConfigWithUlnFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../bootstrap-config'
import { getChainIdForEndpointVersion, processPromises, retryWithBackoff } from '../common-utils'
import { FeeLibV1__factory, connectStargateV2Contract, isStargateV2SupportedChainName } from '../stargate-contracts'

import {
    ByAssetPathConfig,
    errorString,
    parseTargets,
    printByPathAndAssetFlattenConfig,
    timeoutString,
    valueOrTimeout,
} from './utils'

export const getFeeConfigsState = async (args: {
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

    const feesConfigs: ByAssetPathConfig = {}

    await processPromises(
        'FEE CONFIGS STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter((chainName) =>
                bootstrapChainConfig.chainNames.includes(chainName)
            )

            feesConfigs[assetId] ??= {}

            return chainNames.flatMap((srcChainName) => {
                feesConfigs[assetId][srcChainName] ??= {}

                return [
                    ...chainNames.map((chainName) => {
                        return async () => {
                            if (targetsString && !targets.includes(srcChainName) && !targets.includes(chainName)) {
                                return
                            }

                            const { stargateType, address } = config.poolInfo[srcChainName]

                            const stargateContract = connectStargateV2Contract(
                                bootstrapChainConfig.providers[srcChainName],
                                stargateType,
                                address
                            )
                            const { feeLib } = await retryWithBackoff(
                                () => stargateContract.getAddressConfig(),
                                numRetries,
                                srcChainName,
                                `getAddressConfig(${assetId})`
                            )

                            const feeLibContract = FeeLibV1__factory.connect(
                                feeLib,
                                bootstrapChainConfig.providers[srcChainName]
                            )

                            const { zone1FeeMillionth, zone2FeeMillionth, zone3FeeMillionth, rewardMillionth } =
                                await valueOrTimeout(
                                    () =>
                                        feeLibContract.feeConfigs(
                                            getChainIdForEndpointVersion(chainName, environment, EndpointVersion.V2)
                                        ),
                                    {
                                        zone1FeeMillionth: errorString,
                                        zone2FeeMillionth: errorString,
                                        zone3FeeMillionth: errorString,
                                        rewardMillionth: errorString,
                                    },
                                    {
                                        zone1FeeMillionth: timeoutString,
                                        zone2FeeMillionth: timeoutString,
                                        zone3FeeMillionth: timeoutString,
                                        rewardMillionth: timeoutString,
                                    }
                                )

                            feesConfigs[assetId][srcChainName][chainName] = {
                                zone1: zone1FeeMillionth.toString(),
                                zone2: zone2FeeMillionth.toString(),
                                zone3: zone3FeeMillionth.toString(),
                                reward: rewardMillionth.toString(),
                            }
                        }
                    }),
                ]
            })
        })
    )

    return feesConfigs
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('./utils')

        const args = parse({
            header: 'Check Fee Configs State',
            description: 'Check Fee Configs State',
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

        printByPathAndAssetFlattenConfig('FEE CONFIGS STATE', await getFeeConfigsState(args), args.onlyError)
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
