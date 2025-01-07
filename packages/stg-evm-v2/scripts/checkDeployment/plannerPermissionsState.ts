import { backOff } from 'exponential-backoff'

import {
    getBootstrapChainConfigWithUlnFromArgs,
    getBootstrapWalletConfigFromArgs,
    getLocalStargatePoolConfigGetterFromArgs,
} from '@monorepo/args-bootstrap-config'
import {
    FeeLibV1__factory,
    connectStargateV2Contract,
    getStargateV2CreditMessagingContract,
    getStargateV2TokenMessagingContract,
    isStargateV2SupportedChainName,
} from '@monorepo/stargate-v2-contracts'
import { StaticChainConfigs } from '@monorepo/static-config'

import {
    ByAssetConfig,
    printByAssetFlattenConfig,
    StargateVersion,
    processPromises,
} from './utils'

/**
 * Check that the planner wallet has the correct permissions for the messaging contracts and the FeeLib contracts
 */
export const getPlannerPermissionsState = async (args: {
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

    const permissionsState: ByAssetConfig = {}

    await processPromises(
        'PLANNER PERMISSIONS STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter(
                (chainName) =>
                    bootstrapChainConfig.chainNames.includes(chainName),
            )

            permissionsState[assetId] ??= {}

            return chainNames.flatMap((srcChainName) => {
                if (targetsString && !targets.includes(srcChainName)) {
                    return []
                }

                permissionsState[assetId][srcChainName] ??= {}

                return async () => {
                    // Get stargate planner wallet address
                    const plannerWalletName =
                        bootstrapWalletConfig.serviceWalletMapping.planner
                    const plannerWalletDefinition =
                        bootstrapWalletConfig.walletDefinitions.find(
                            (wallet) => wallet.name === plannerWalletName,
                        )

                    const chainType =
                        StaticChainConfigs.getChainType(srcChainName)

                    const plannerWalletAddress =
                        plannerWalletDefinition?.byChainType[chainType].address
                    if (!plannerWalletAddress) {
                        throw new Error(
                            `Couldn't determine the Planner wallet address for chain type: ${chainType}, name: ${plannerWalletName}`,
                        )
                    }

                    const tokenMessagingContract =
                        getStargateV2TokenMessagingContract(
                            srcChainName,
                            environment,
                            bootstrapChainConfig.providers[srcChainName],
                        )

                    const creditMessagingContract =
                        getStargateV2CreditMessagingContract(
                            srcChainName,
                            environment,
                            bootstrapChainConfig.providers[srcChainName],
                        )

                    const tokenMessagingPlannerAddress =
                        await tokenMessagingContract.planner()
                    const creditMessagingPlannerAddress =
                        await creditMessagingContract.planner()

                    // Verify that the planner wallet has the 'planner' role for messaging contracts
                    const tokenMessagingPlannerError =
                        tokenMessagingPlannerAddress === plannerWalletAddress
                            ? ''
                            : `error: expected TokenMessaging planner ${plannerWalletAddress} but is currently ${tokenMessagingPlannerAddress}`
                    const creditMessagingPlannerError =
                        creditMessagingPlannerAddress === plannerWalletAddress
                            ? ''
                            : `error: expected CreditMessaging planner ${plannerWalletAddress} but is currently ${creditMessagingPlannerAddress}`

                    // Verify that the planner wallet is the owner of the FeeLib contracts
                    const { stargateType, address } =
                        config.poolInfo[srcChainName]

                    const stargateContract = connectStargateV2Contract(
                        bootstrapChainConfig.providers[srcChainName],
                        stargateType,
                        address,
                    )
                    const { feeLib } = await backOff(
                        () => stargateContract.getAddressConfig(),
                        {
                            delayFirstAttempt: false,
                            jitter: 'full',
                            numOfAttempts: 3,
                            startingDelay: 5000,
                            timeMultiple: 3,
                        },
                    )

                    const feeLibContract = FeeLibV1__factory.connect(
                        feeLib,
                        bootstrapChainConfig.providers[srcChainName],
                    )
                    const feeLibOwnerAddress = await feeLibContract.owner()

                    const feeLibOwnerError =
                        feeLibOwnerAddress === plannerWalletAddress
                            ? ''
                            : `error: expected FeeLib owner ${plannerWalletAddress} but is currently ${feeLibOwnerAddress}`

                    // Populate result state
                    permissionsState[assetId][srcChainName] = {
                        tokenMessaging: tokenMessagingPlannerError
                            ? tokenMessagingPlannerError
                            : '',
                        creditMessaging: creditMessagingPlannerError
                            ? creditMessagingPlannerError
                            : '',
                        feeLib: feeLibOwnerError ? feeLibOwnerError : '',
                    }
                }
            })
        }),
    )
    return permissionsState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('@monorepo/args')

        const args = parse({
            header: 'Check Permissions State',
            description: 'Check Permissions State',
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

        printByAssetFlattenConfig(
            'PLANNER PERMISSIONS STATE',
            await getPlannerPermissionsState(args),
        )
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
