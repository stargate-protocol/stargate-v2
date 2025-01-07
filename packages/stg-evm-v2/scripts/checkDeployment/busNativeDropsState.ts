import {
    getBootstrapChainConfigWithUlnFromArgs,
    getLocalStargatePoolConfigGetterFromArgs,
} from '@monorepo/args-bootstrap-config'
import { getExecutorContract } from '@monorepo/lz-evm-sdk-v2-contracts'
import { getStargateV2TokenMessagingContract, isStargateV2SupportedChainName } from '@monorepo/stargate-v2-contracts'
import { getChainIdForEndpointVersion } from '@monorepo/static-config'
import { BigNumber } from 'ethers'

import { EndpointVersion } from '@layerzerolabs/lz-definitions'

import { ByAssetPathConfig, StargateVersion, printByPathAndAssetFlattenConfig, processPromises } from './utils'

export const getBusNativeDropsState = async (args: { environment: string; only: string; targets: string }) => {
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
        isStargateV2SupportedChainName
    )

    const stargatePoolConfigGetter = await getLocalStargatePoolConfigGetterFromArgs(environment)

    const poolsConfig = stargatePoolConfigGetter.getPoolsConfig()[StargateVersion.V2]

    const busNativeDropsState: ByAssetPathConfig = {}

    await processPromises(
        'BUS NATIVE DROPS STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            // Get chain names
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
                            const maxNumPassengers: number = (await tokenMessagingContract.busQueues(toChainId))
                                .maxNumPassengers
                            const maxNativeDropPerPassenger: BigNumber =
                                await tokenMessagingContract.nativeDropAmounts(toChainId)
                            const maxBusNativeDropAmount = maxNativeDropPerPassenger.mul(maxNumPassengers)

                            const executorNativeCap = (await executorContract.dstConfig(toChainId)).nativeCap

                            const error = maxBusNativeDropAmount.gt(executorNativeCap)
                                ? `error: maxBusNativeDropAmount(${maxBusNativeDropAmount.toString()}) > executorNativeCap(${executorNativeCap.toString()})!`
                                : null

                            busNativeDropsState[assetId][fromChainName][toChainName] = {
                                maxBusNativeDropAmount: error ?? maxBusNativeDropAmount.toString(),
                                executorNativeCap: error ?? executorNativeCap.toString(),
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
        const { parse } = await import('@monorepo/args')

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
            },
        })

        printByPathAndAssetFlattenConfig('BUS NATIVE DROPS STATE', await getBusNativeDropsState(args))
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
