import { ethers } from 'ethers'

import {
    getBootstrapChainConfigWithUlnFromArgs,
    getBootstrapWalletConfigFromArgs,
    getLocalStargatePoolConfigGetterFromArgs,
} from '@monorepo/args-bootstrap-config'
import { isStargateV2SupportedChainName } from '@monorepo/stargate-v2-contracts'
import { StaticChainConfigs } from '@monorepo/static-config'

import { ByChainConfig, printByChainConfig, processPromises, StargateVersion } from './utils'

export const getPlannerNativeBalanceState = async (args: {
    environment: string
    only: string
}) => {
    const { environment, only } = args
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

    const bootstrapWalletConfig = await getBootstrapWalletConfigFromArgs(
        service,
        {
            noFork: true,
            environment,
            mnemonicConfig: 'local',
        },
    )

    const stargatePoolConfigGetter =
        await getLocalStargatePoolConfigGetterFromArgs(environment)

    const poolsConfig =
        stargatePoolConfigGetter.getPoolsConfig()[StargateVersion.V2]

    // Get all chain names from all pools
    const allPoolChainNames = [
        ...new Set(
            Object.entries(poolsConfig).flatMap(([assetId, config]) =>
                Object.keys(config.poolInfo),
            ),
        ),
    ]
    const chainNames = bootstrapChainConfig.chainNames.filter((chainName) =>
        allPoolChainNames.includes(chainName),
    )

    const plannerNativeBalanceState: ByChainConfig = {}

    await processPromises(
        'PLANNER NATIVE BALANCE STATE',
        chainNames.map((chainName) => {
            plannerNativeBalanceState[chainName] ??= {}
            return async () => {
                const provider = bootstrapChainConfig.providers[chainName]

                const chainType = StaticChainConfigs.getChainType(chainName)

                // Get stargate planner wallet address
                const plannerWalletName =
                    bootstrapWalletConfig.serviceWalletMapping.planner
                const plannerWalletDefinition =
                    bootstrapWalletConfig.walletDefinitions.find(
                        (wallet) => wallet.name === plannerWalletName,
                    )
                const plannerWalletAddress =
                    plannerWalletDefinition?.byChainType[chainType].address
                if (!plannerWalletAddress) {
                    throw new Error(
                        `Couldn't determine the Planner wallet address for chain type: ${chainType}, name: ${plannerWalletName}`,
                    )
                }

                const balance = await provider.getBalance(plannerWalletAddress)

                const nativeDecimals = StaticChainConfigs.getDecimals(chainName)
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
        }),
    )

    return plannerNativeBalanceState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('@monorepo/args')

        const args = parse({
            header: 'Check Planner Native Balance State',
            description:
                'Ensures that the planner wallet has enough balance on all chains to start planner deployment',
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
            },
        })

        printByChainConfig(
            'PLANNER NATIVE BALANCE STATE',
            await getPlannerNativeBalanceState(args),
        )
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
