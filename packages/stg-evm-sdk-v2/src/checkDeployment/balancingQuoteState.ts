import { Chain, EndpointVersion, Stage, chainAndStageToEndpointId } from '@layerzerolabs/lz-definitions'

import { isStargateV2SupportedChainName, processPromises, retryWithBackoff } from '../common-utils'
import { getBootstrapChainConfigFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../config'
import { getStargateV2CreditMessagingContract } from '../stargate-contracts'

import {
    ByAssetPathConfig,
    errorString,
    parseTargets,
    printByPathAndAssetFlattenConfig,
    timeoutString,
    valueOrTimeout,
} from './utils'

export const getBalancingQuoteState = async (args: {
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

    const quotesState: ByAssetPathConfig = {}

    await processPromises(
        'BALANCING QUOTES STATE',
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

                                const dstEid = chainAndStageToEndpointId(
                                    toChainName as Chain,
                                    environment as Stage,
                                    EndpointVersion.V2
                                ).toString()

                                const creditMessagingContract = getStargateV2CreditMessagingContract(
                                    fromChainName,
                                    environment,
                                    bootstrapChainConfig.providers[fromChainName]
                                )

                                const gasLimit = await retryWithBackoff(
                                    () => creditMessagingContract.gasLimits(dstEid),
                                    numRetries,
                                    fromChainName,
                                    `gasLimits(${dstEid})`
                                )

                                if (gasLimit.isZero()) {
                                    quotesState[assetId][fromChainName][toChainName] = {
                                        nativeFee: `error: gas limit for ${fromChainName}->${toChainName} is zero`,
                                        lzTokenFee: `error: gas limit for ${fromChainName}->${toChainName} is zero`,
                                    }
                                    return
                                }

                                const quote = await valueOrTimeout(
                                    () =>
                                        retryWithBackoff(
                                            () => creditMessagingContract.quoteSendCredits(dstEid, []),
                                            numRetries,
                                            fromChainName,
                                            `quoteSendCredits(${dstEid})`
                                        ),
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
        const { parse } = await import('../common-utils')

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
                numRetries: {
                    alias: 'r',
                    type: Number,
                    defaultValue: 3,
                    description: 'Number of retries for RPC calls before giving up',
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
