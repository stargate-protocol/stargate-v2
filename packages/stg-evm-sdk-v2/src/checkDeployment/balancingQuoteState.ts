import { EndpointVersion } from '@layerzerolabs/lz-definitions'

import { getBootstrapChainConfigWithUlnFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../bootstrap-config'
import { getStargateV2CreditMessagingContract, isStargateV2SupportedChainName } from '../stargate-contracts'

import {
    ByAssetPathConfig,
    StargateVersion,
    errorString,
    getChainIdForEndpointVersion,
    printByPathAndAssetFlattenConfig,
    processBootstrapChainNames,
    processPromises,
    timeoutString,
    valueOrTimeout,
} from './utils'

export const getBalancingQuoteState = async (args: { environment: string; only: string; targets: string }) => {
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

    const quotesState: ByAssetPathConfig = {}

    await processPromises(
        'BALANCING QUOTES STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const { bootstrapRawChainNames, rawToDeploymentMap } = processBootstrapChainNames(
                bootstrapChainConfig.chainNames
            )

            const chainNames = Object.keys(config.poolInfo).filter((chainName) =>
                bootstrapRawChainNames.includes(chainName)
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

                                const dstEid = getChainIdForEndpointVersion(
                                    toChainName,
                                    environment,
                                    EndpointVersion.V2
                                )

                                const creditMessagingContract = getStargateV2CreditMessagingContract(
                                    fromChainName,
                                    environment,
                                    bootstrapChainConfig.providers[rawToDeploymentMap[fromChainName]]
                                )

                                const gasLimit = await creditMessagingContract.gasLimits(dstEid)
                                if (gasLimit.isZero()) {
                                    quotesState[assetId][fromChainName][toChainName] = {
                                        nativeFee: `error: gas limit for ${fromChainName}->${toChainName} is zero`,
                                        lzTokenFee: `error: gas limit for ${fromChainName}->${toChainName} is zero`,
                                    }
                                    return
                                }

                                const quote = await valueOrTimeout(
                                    () => creditMessagingContract.quoteSendCredits(dstEid, []),
                                    {
                                        nativeFee: errorString,
                                        lzTokenFee: errorString,
                                    },
                                    {
                                        nativeFee: timeoutString,
                                        lzTokenFee: timeoutString,
                                    }
                                )

                                quotesState[assetId][fromChainName][toChainName] = {
                                    nativeFee: quote.nativeFee.toString(),
                                    lzTokenFee: quote.lzTokenFee.toString(),
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
        const { parse } = await import('./utils')

        const args = parse({
            header: 'Check Balancing Quotes State',
            description: 'Check Balancing Quotes State',
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

        printByPathAndAssetFlattenConfig('BALANCING QUOTES STATE', await getBalancingQuoteState(args))
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
