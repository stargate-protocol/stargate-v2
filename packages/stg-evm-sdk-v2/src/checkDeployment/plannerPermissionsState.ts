import { DEFAULT_PLANNER } from '@stargatefinance/stg-evm-v2/devtools/config/mainnet/01/constants'

import { getBootstrapChainConfigWithUlnFromArgs, getLocalStargatePoolConfigGetterFromArgs } from '../bootstrap-config'
import {
    FeeLibV1__factory,
    connectStargateV2Contract,
    getStargateV2CreditMessagingContract,
    getStargateV2TokenMessagingContract,
    isStargateV2SupportedChainName,
} from '../stargate-contracts'
import { processPromises, retryWithBackoff } from '../utils'

import { ByAssetConfig, parseTargets, printByAssetFlattenConfig } from './utils'

/**
 * Check that the planner wallet has the correct permissions for the messaging contracts and the FeeLib contracts
 */
export const getPlannerPermissionsState = async (args: {
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

    const permissionsState: ByAssetConfig = {}

    await processPromises(
        'PLANNER PERMISSIONS STATE',
        Object.entries(poolsConfig).flatMap(([assetId, config]) => {
            const chainNames = Object.keys(config.poolInfo).filter((chainName) =>
                bootstrapChainConfig.chainNames.includes(chainName)
            )

            permissionsState[assetId] ??= {}

            return chainNames.flatMap((srcChainName) => {
                if (targetsString && !targets.includes(srcChainName)) {
                    return []
                }

                permissionsState[assetId][srcChainName] ??= {}

                return async () => {
                    const tokenMessagingContract = getStargateV2TokenMessagingContract(
                        srcChainName,
                        environment,
                        bootstrapChainConfig.providers[srcChainName]
                    )

                    const creditMessagingContract = getStargateV2CreditMessagingContract(
                        srcChainName,
                        environment,
                        bootstrapChainConfig.providers[srcChainName]
                    )

                    const tokenMessagingPlannerAddress = await retryWithBackoff(
                        () => tokenMessagingContract.planner(),
                        numRetries,
                        srcChainName,
                        'tokenMessaging.planner()'
                    )
                    const creditMessagingPlannerAddress = await retryWithBackoff(
                        () => creditMessagingContract.planner(),
                        numRetries,
                        srcChainName,
                        'creditMessaging.planner()'
                    )

                    // Verify that the planner wallet has the 'planner' role for messaging contracts
                    const tokenMessagingPlannerError =
                        tokenMessagingPlannerAddress === DEFAULT_PLANNER
                            ? ''
                            : `error: expected TokenMessaging planner ${DEFAULT_PLANNER} but is currently ${tokenMessagingPlannerAddress}`
                    const creditMessagingPlannerError =
                        creditMessagingPlannerAddress === DEFAULT_PLANNER
                            ? ''
                            : `error: expected CreditMessaging planner ${DEFAULT_PLANNER} but is currently ${creditMessagingPlannerAddress}`

                    // Verify that the planner wallet is the owner of the FeeLib contracts
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
                    const feeLibOwnerAddress = await retryWithBackoff(
                        () => feeLibContract.owner(),
                        numRetries,
                        srcChainName,
                        'feeLibContract.owner()'
                    )

                    const feeLibOwnerError =
                        feeLibOwnerAddress === DEFAULT_PLANNER
                            ? ''
                            : `error: expected FeeLib owner ${DEFAULT_PLANNER} but is currently ${feeLibOwnerAddress}`

                    // Populate result state
                    permissionsState[assetId][srcChainName] = {
                        tokenMessaging: tokenMessagingPlannerError ? tokenMessagingPlannerError : '',
                        creditMessaging: creditMessagingPlannerError ? creditMessagingPlannerError : '',
                        feeLib: feeLibOwnerError ? feeLibOwnerError : '',
                    }
                }
            })
        })
    )
    return permissionsState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('./utils')

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

        printByAssetFlattenConfig('PLANNER PERMISSIONS STATE', await getPlannerPermissionsState(args), args.onlyError)
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
