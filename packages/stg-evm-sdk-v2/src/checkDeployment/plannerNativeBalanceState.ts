import { DEFAULT_PLANNER } from '@stargatefinance/stg-evm-v2/devtools/config/mainnet/01/constants'
import { ethers } from 'ethers'

import { isStargateV2SupportedChainName, processPromises, retryWithBackoff } from '../common-utils'
import { getBootstrapChainConfigFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../config'
import { getNativeCurrencyDecimals } from '../stargate-sdks/utils'

import { ByChainConfig, printByChainConfig } from './utils'

export const getPlannerNativeBalanceState = async (args: {
    environment: string
    only: string
    numRetries?: number
}) => {
    const { environment, only, numRetries = 3 } = args

    const bootstrapChainConfig = await getBootstrapChainConfigFromArgs(
        {
            environment,
            only,
        },
        isStargateV2SupportedChainName
    )

    const stargatePoolConfigGetter = await getLocalStargatePoolConfigGetterFromArgs(environment)

    const poolsConfig = stargatePoolConfigGetter.getPoolsConfig()

    // Get all chain names from all pools
    const allPoolChainNames = [
        ...new Set(Object.entries(poolsConfig).flatMap(([assetId, config]) => Object.keys(config.poolInfo))),
    ]
    const chainNames = bootstrapChainConfig.chainNames.filter((chainName) => allPoolChainNames.includes(chainName))

    const plannerNativeBalanceState: ByChainConfig = {}

    await processPromises(
        'PLANNER NATIVE BALANCE STATE',
        chainNames.map((chainName) => {
            plannerNativeBalanceState[chainName] ??= {}
            return async () => {
                const provider = bootstrapChainConfig.providers[chainName]

                // Get stargate planner wallet address
                const plannerWalletAddress = DEFAULT_PLANNER

                const balance = await retryWithBackoff(
                    () => provider.getBalance(plannerWalletAddress),
                    numRetries,
                    chainName,
                    'provider.getBalance()'
                )

                const nativeDecimals = getNativeCurrencyDecimals(chainName)
                const nativeBalanceThreshold: string = ethers.utils
                    .parseUnits('0.1', nativeDecimals) // 0.1 native token
                    .toString()

                const error = balance.lt(nativeBalanceThreshold)
                    ? `error: planner wallet has less than 0.1 native token on ${chainName}, balance: ${balance.toString()}, threshold: ${nativeBalanceThreshold}, address: ${plannerWalletAddress}`
                    : null

                plannerNativeBalanceState[chainName] = {
                    balance: error ? error : balance.toString(),
                }
            }
        })
    )

    return plannerNativeBalanceState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('../common-utils')

        const args = parse({
            header: 'Check Planner Native Balance State',
            description: 'Ensures that the planner wallet has enough balance on all chains to start planner deployment',
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

        printByChainConfig('PLANNER NATIVE BALANCE STATE', await getPlannerNativeBalanceState(args), args.onlyError)
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
