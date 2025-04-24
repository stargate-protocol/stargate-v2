import {
    AssetOmniGraphHardhatSchema,
    CreditMessagingOmniGraphHardhatSchema,
    ERC20OmniGraphHardhatSchema,
    FeeLibV1OmniGraphHardhatSchema,
    MintableOmniGraphHardhatSchema,
    OFTWrapperOmniGraphHardhatSchema,
    PoolOmniGraphHardhatSchema,
    RewarderOmniGraphHardhatSchema,
    RewarderRewardsOmniGraphHardhatSchema,
    StakingOmniGraphHardhatSchema,
    TokenMessagingOmniGraphHardhatSchema,
    TreasurerOmniGraphHardhatSchema,
    USDCOmniGraphHardhatSchema,
    createAssetFactory,
    createCreditMessagingFactory,
    createERC20Factory,
    createFeeLibV1Factory,
    createMintableFactory,
    createOFTWrapperFactory,
    createPoolFactory,
    createRewarderFactory,
    createStakingFactory,
    createTokenMessagingFactory,
    createTreasurerFactory,
    createUSDCFactory,
} from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    AssetOmniGraph,
    CreditMessagingOmniGraph,
    ERC20OmniGraph,
    FeeLibV1OmniGraph,
    IAsset,
    ICreditMessaging,
    IERC20,
    IFeeLibV1,
    IMintable,
    IOFTWrapper,
    IPool,
    IRewarder,
    IStaking,
    ITokenMessaging,
    ITreasurer,
    IUSDC,
    MintableOmniGraph,
    OFTWrapperOmniGraph,
    PoolOmniGraph,
    RewarderOmniGraph,
    RewarderRewardsOmniGraph,
    StakingOmniGraph,
    TokenMessagingOmniGraph,
    TreasurerOmniGraph,
    USDCOmniGraph,
    configureAsset,
    configureCreditMessaging,
    configureDeposit,
    configureERC20,
    configureFeeLibV1,
    configureMintable,
    configureOFTWrapper,
    configureProxyAdmin,
    configureRewarder,
    configureRewards,
    configureStaking,
    configureTokenMessaging,
    configureTreasurer,
    configureUSDC,
    initializeBusQueueStorage,
    initializeMinters,
} from '@stargatefinance/stg-devtools-v2'
import { subtask, task } from 'hardhat/config'

import { createConnectedContractFactory, inheritTask } from '@layerzerolabs/devtools-evm-hardhat'
import {
    SUBTASK_LZ_OAPP_CONFIG_LOAD,
    SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
    SubtaskConfigureTaskArgs,
    SubtaskLoadConfigTaskArgs,
    TASK_LZ_OAPP_WIRE,
} from '@layerzerolabs/ua-devtools-evm-hardhat'

import {
    TASK_STG_ADD_LIQUIDITY,
    TASK_STG_CHECK_ASSET,
    TASK_STG_CHECK_CREDIT_MESSAGING,
    TASK_STG_CHECK_FEELIB_V1,
    TASK_STG_CHECK_OFT_WRAPPER,
    TASK_STG_CHECK_REWARDER,
    TASK_STG_CHECK_STAKING,
    TASK_STG_CHECK_TOKEN_MESSAGING,
    TASK_STG_CHECK_TREASURER,
    TASK_STG_SET_MINT_ALLOWANCE,
    TASK_STG_SET_REWARDS,
    TASK_STG_WIRE_ASSET,
    TASK_STG_WIRE_CREDIT_MESSAGING,
    TASK_STG_WIRE_FEELIB_V1,
    TASK_STG_WIRE_OFT,
    TASK_STG_WIRE_OFT_WRAPPER,
    TASK_STG_WIRE_REWARDER,
    TASK_STG_WIRE_STAKING,
    TASK_STG_WIRE_TOKEN_MESSAGING,
    TASK_STG_WIRE_TOKEN_MESSAGING_INITIALIZE_STORAGE,
    TASK_STG_WIRE_TREASURER,
    TASK_STG_WIRE_USDC,
    TASK_STG_WIRE_USDC_INITIALIZE_MINTER,
    TASK_STG_WIRE_USDC_SET_ADMIN,
} from './constants'
import { checkResult } from './utils'

const wireTask = inheritTask(TASK_LZ_OAPP_WIRE)

/**
 * Wiring task for credit messaging contracts
 */
wireTask(TASK_STG_WIRE_CREDIT_MESSAGING).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load credit messaging config',
        (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
            runSuper({
                ...args,
                schema: CreditMessagingOmniGraphHardhatSchema,
            })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure credit messaging',
        (args: SubtaskConfigureTaskArgs<CreditMessagingOmniGraph, ICreditMessaging>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureCreditMessaging,
                sdkFactory: createCreditMessagingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for token messaging contracts
 */
wireTask(TASK_STG_WIRE_TOKEN_MESSAGING).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load token messaging config',
        (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
            runSuper({
                ...args,
                schema: TokenMessagingOmniGraphHardhatSchema,
            })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure token messaging',
        (args: SubtaskConfigureTaskArgs<TokenMessagingOmniGraph, ITokenMessaging>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureTokenMessaging,
                sdkFactory: createTokenMessagingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for token messaging contracts
 */
wireTask(TASK_STG_WIRE_TOKEN_MESSAGING_INITIALIZE_STORAGE).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load token messaging config',
        (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
            runSuper({
                ...args,
                schema: TokenMessagingOmniGraphHardhatSchema,
            })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Initialize storage for token messaging',
        (args: SubtaskConfigureTaskArgs<TokenMessagingOmniGraph, ITokenMessaging>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: initializeBusQueueStorage,
                sdkFactory: createTokenMessagingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for asset contracts
 */
wireTask(TASK_STG_WIRE_ASSET).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load asset config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: AssetOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure asset',
        (args: SubtaskConfigureTaskArgs<AssetOmniGraph, IAsset>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureAsset,
                sdkFactory: createAssetFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for feelib V1 contracts
 */
wireTask(TASK_STG_WIRE_FEELIB_V1).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load feelib config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: FeeLibV1OmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure feelib V1',
        (args: SubtaskConfigureTaskArgs<FeeLibV1OmniGraph, IFeeLibV1>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureFeeLibV1,
                sdkFactory: createFeeLibV1Factory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for treasurer contracts
 */
wireTask(TASK_STG_WIRE_TREASURER).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load treasurer config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: TreasurerOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure treasurer',
        (args: SubtaskConfigureTaskArgs<TreasurerOmniGraph, ITreasurer>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureTreasurer,
                sdkFactory: createTreasurerFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for OFT contracts
 */
wireTask(TASK_STG_WIRE_OFT).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load OFT config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: MintableOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure OFT',
        (args: SubtaskConfigureTaskArgs<MintableOmniGraph, IMintable>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureMintable,
                sdkFactory: createMintableFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for USDC contracts
 */
wireTask(TASK_STG_WIRE_USDC).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load USDC config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: USDCOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure USDC',
        (args: SubtaskConfigureTaskArgs<USDCOmniGraph, IUSDC>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureUSDC,
                sdkFactory: createUSDCFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for USDC contract to add the asset contract to minters with a high allowance
 */
wireTask(TASK_STG_WIRE_USDC_SET_ADMIN).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load USDC config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: USDCOmniGraphHardhatSchema,
        })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Set admin for USDC',
        (args: SubtaskConfigureTaskArgs<USDCOmniGraph, IUSDC>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureProxyAdmin,
                sdkFactory: createUSDCFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for USDC contract to add the asset contract to minters with a high allowance
 */
wireTask(TASK_STG_WIRE_USDC_INITIALIZE_MINTER).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load USDC config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: USDCOmniGraphHardhatSchema,
        })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Initialize minters for USDC',
        (args: SubtaskConfigureTaskArgs<USDCOmniGraph, IUSDC>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: initializeMinters,
                sdkFactory: createUSDCFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for rewarder contracts
 */
wireTask(TASK_STG_WIRE_REWARDER).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load rewarder config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: RewarderOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure rewarder',
        (args: SubtaskConfigureTaskArgs<RewarderOmniGraph, IRewarder>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureRewarder,
                sdkFactory: createRewarderFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for setting rewards
 */
wireTask(TASK_STG_SET_REWARDS).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load rewarder config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: RewarderRewardsOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Set rewards',
        (args: SubtaskConfigureTaskArgs<RewarderRewardsOmniGraph, IRewarder>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureRewards,
                sdkFactory: createRewarderFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for staking contracts
 */
wireTask(TASK_STG_WIRE_STAKING).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load staking config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: StakingOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure staking',
        (args: SubtaskConfigureTaskArgs<StakingOmniGraph, IStaking>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureStaking,
                sdkFactory: createStakingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for OFT Wrapper contracts
 */
wireTask(TASK_STG_WIRE_OFT_WRAPPER).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load OFT Wrapper config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: OFTWrapperOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure OFT Wrapper',
        (args: SubtaskConfigureTaskArgs<OFTWrapperOmniGraph, IOFTWrapper>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureOFTWrapper,
                sdkFactory: createOFTWrapperFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for setting allowance
 */
wireTask(TASK_STG_SET_MINT_ALLOWANCE).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load allowance config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: ERC20OmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure allowance',
        (args: SubtaskConfigureTaskArgs<ERC20OmniGraph, IERC20>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureERC20,
                sdkFactory: createERC20Factory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Task for adding liquidity to a pool
 */
wireTask(TASK_STG_ADD_LIQUIDITY).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load liquidity config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: PoolOmniGraphHardhatSchema,
        })
    )

    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure liquidity',
        (args: SubtaskConfigureTaskArgs<PoolOmniGraph, IPool>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureDeposit,
                sdkFactory: createPoolFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Check task for assets are fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_ASSET, 'Check asset')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_ASSET, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Check task for feelibs are fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_FEELIB_V1, 'Check feelib')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_FEELIB_V1, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })
// npx hardhat stg:check::feelib-v1 --oapp-config ./devtools/config/mainnet/01/feelib-v1.eth.config.ts
/**
 * Check task for treasurer is fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_TREASURER, 'Check treasurer')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_TREASURER, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Check task for staking is fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_STAKING, 'Check staking')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_STAKING, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Check task for rewarder is fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_REWARDER, 'Check rewarder')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_REWARDER, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Check task for oft wrapper is fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_OFT_WRAPPER, 'Check OFT Wrapper')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_OFT_WRAPPER, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Check task for oft credit messaging is fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_CREDIT_MESSAGING, 'Check Credit Messaging')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_CREDIT_MESSAGING, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Check task for oft token messaging is fully wired
 * throw an error if there are still pending transactions to wire
 */
task(TASK_STG_CHECK_TOKEN_MESSAGING, 'Check Token Messaging')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_TOKEN_MESSAGING, {
            ...args,
            // logLevel: 'error',
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })
