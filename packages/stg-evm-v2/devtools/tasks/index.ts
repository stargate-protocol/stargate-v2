import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'

import {
    AssetOmniGraphHardhatSchema,
    CircleFiatTokenOmniGraphHardhatSchema,
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
    createAssetFactory,
    createCircleFiatTokenFactory,
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
} from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    AssetOmniGraph,
    CircleFiatTokenOmniGraph,
    CreditMessagingOmniGraph,
    ERC20OmniGraph,
    FeeLibV1OmniGraph,
    IAsset,
    ICircleFiatToken,
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
    MintableOmniGraph,
    OFTWrapperOmniGraph,
    PoolOmniGraph,
    RewarderOmniGraph,
    RewarderRewardsOmniGraph,
    StakingOmniGraph,
    TokenMessagingOmniGraph,
    TreasurerOmniGraph,
    configureAsset,
    configureCircleFiatToken,
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
    initializeBusQueueStorage,
    initializeMinters,
} from '@stargatefinance/stg-devtools-v2'
import { subtask, task } from 'hardhat/config'

import { SignerDefinition } from '@layerzerolabs/devtools-evm'
import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createConnectedContractFactory,
    createGnosisSignerFactory,
    createSignerFactory,
    inheritTask,
    types,
} from '@layerzerolabs/devtools-evm-hardhat'
import { createLogger } from '@layerzerolabs/lz-utilities'
import { type IOApp, type OAppOmniGraph, configureOAppDelegates } from '@layerzerolabs/ua-devtools'
import { createOAppFactory } from '@layerzerolabs/ua-devtools-evm'
import {
    SUBTASK_LZ_OAPP_CONFIG_LOAD,
    SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
    SubtaskConfigureTaskArgs,
    SubtaskLoadConfigTaskArgs,
    TASK_LZ_OAPP_WIRE,
} from '@layerzerolabs/ua-devtools-evm-hardhat'

import { createOneSigSignerFactory } from '../onesig'

import {
    TASK_LZ_OWNABLE_TRANSFER_OWNERSHIP,
    TASK_STG_ADD_LIQUIDITY,
    TASK_STG_CHECK_ASSET,
    TASK_STG_CHECK_CREDIT_MESSAGING,
    TASK_STG_CHECK_FEELIB_V1,
    TASK_STG_CHECK_OFT_WRAPPER,
    TASK_STG_CHECK_REWARDER,
    TASK_STG_CHECK_STAKING,
    TASK_STG_CHECK_TOKEN_MESSAGING,
    TASK_STG_CHECK_TREASURER,
    TASK_STG_GET_CONFIG_HASHES,
    TASK_STG_OWNABLE_TRANSFER_OWNERSHIP,
    TASK_STG_SET_MINT_ALLOWANCE,
    TASK_STG_SET_REWARDS,
    TASK_STG_WIRE_ASSET,
    TASK_STG_WIRE_CIRCLE_TOKEN,
    TASK_STG_WIRE_CIRCLE_TOKEN_INITIALIZE_MINTER,
    TASK_STG_WIRE_CIRCLE_TOKEN_SET_ADMIN,
    TASK_STG_WIRE_CREDIT_MESSAGING,
    TASK_STG_WIRE_FEELIB_V1,
    TASK_STG_WIRE_MESSAGING_DELEGATE,
    TASK_STG_WIRE_OFT,
    TASK_STG_WIRE_OFT_WRAPPER,
    TASK_STG_WIRE_REWARDER,
    TASK_STG_WIRE_STAKING,
    TASK_STG_WIRE_TOKEN_MESSAGING,
    TASK_STG_WIRE_TOKEN_MESSAGING_INITIALIZE_STORAGE,
    TASK_STG_WIRE_TREASURER,
} from './constants'
import { checkResult } from './utils'

import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

/**
 * Extends the TASK_LZ_OAPP_WIRE task by adding a custom `--onesig` flag to control how transactions are proposed.
 * Overrides the sign-and-send logic to select the appropriate signer based on whether to use 'safe', 'onesig', or 'eoa'.
 * Executes the original task action via `runSuper()` after injecting the custom signer behavior.
 */

task(TASK_LZ_OAPP_WIRE)
    .addFlag('onesig', 'Whether to use oneSig for the transactions')
    .setAction(async (args, hre, runSuper) => {
        overrideSignAndSendTask(args.safe, args.onesig, args.signer)
        return runSuper(args)
    })

const wireTask = inheritTask(TASK_LZ_OAPP_WIRE)

function overrideSignAndSendTask(safe: boolean, onesig: boolean, signer: SignerDefinition) {
    if (safe && onesig) {
        throw new Error('Safe and oneSig cannot be used together')
    }

    // if safe, use gnosis signer
    // if onesig, use oneSig signer
    // otherwise, use eoa factory
    const createSigner = safe
        ? createGnosisSignerFactory(signer)
        : onesig
          ? createOneSigSignerFactory(signer)
          : createSignerFactory(signer)

    subtask(SUBTASK_LZ_SIGN_AND_SEND, 'Sign and send transactions', (args: SignAndSendTaskArgs, _hre, runSuper) => {
        return runSuper({
            ...args,
            createSigner,
        })
    })
}

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
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load messaging config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
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
 * Wiring task for EURC/USDC contracts
 */
wireTask(TASK_STG_WIRE_CIRCLE_TOKEN)
    .addOptionalParam('tokenName', 'The token name to wire', 'CircleFiatToken')
    .setAction(async (args, hre) => {
        const tokenName = args.tokenName.toUpperCase()

        // Here we'll overwrite the config loading & configuration tasks just-in-time
        //
        // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
        // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
        // the task that runs first will overwrite the original subtask definition
        // whereas the task that runs later will overwrite the overwritten task definition
        subtask(
            SUBTASK_LZ_OAPP_CONFIG_LOAD,
            `Load ${tokenName} config`,
            (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
                runSuper({
                    ...args,
                    schema: CircleFiatTokenOmniGraphHardhatSchema,
                })
        )

        subtask(
            SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
            `Configure ${tokenName}`,
            (args: SubtaskConfigureTaskArgs<CircleFiatTokenOmniGraph, ICircleFiatToken>, hre, runSuper) =>
                runSuper({
                    ...args,
                    configurator: configureCircleFiatToken,
                    sdkFactory: createCircleFiatTokenFactory(createConnectedContractFactory()),
                })
        )

        return hre.run(TASK_LZ_OAPP_WIRE, args)
    })

/**
 * Wiring task for USDC contract to add the asset contract to minters with a high allowance
 */
wireTask(TASK_STG_WIRE_CIRCLE_TOKEN_SET_ADMIN).setAction(async (args, hre) => {
    // Here we'll overwrite the config loading & configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load USDC config', (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
        runSuper({
            ...args,
            schema: CircleFiatTokenOmniGraphHardhatSchema,
        })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Set admin for USDC',
        (args: SubtaskConfigureTaskArgs<CircleFiatTokenOmniGraph, ICircleFiatToken>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureProxyAdmin,
                sdkFactory: createCircleFiatTokenFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Wiring task for EURC/USDC contract to add the asset contract to minters with a high allowance
 */
wireTask(TASK_STG_WIRE_CIRCLE_TOKEN_INITIALIZE_MINTER)
    .addOptionalParam('tokenName', 'The token name to wire', 'CircleFiatToken')
    .setAction(async (args, hre) => {
        const tokenName = args.tokenName.toUpperCase()

        // Here we'll overwrite the config loading & configuration tasks just-in-time
        //
        // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
        // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
        // the task that runs first will overwrite the original subtask definition
        // whereas the task that runs later will overwrite the overwritten task definition
        subtask(
            SUBTASK_LZ_OAPP_CONFIG_LOAD,
            `Load ${tokenName} config`,
            (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
                runSuper({
                    ...args,
                    schema: CircleFiatTokenOmniGraphHardhatSchema,
                })
        )
        subtask(
            SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
            `Initialize minters for ${tokenName}`,
            (args: SubtaskConfigureTaskArgs<CircleFiatTokenOmniGraph, ICircleFiatToken>, hre, runSuper) =>
                runSuper({
                    ...args,
                    configurator: initializeMinters,
                    sdkFactory: createCircleFiatTokenFactory(createConnectedContractFactory()),
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

wireTask(TASK_STG_OWNABLE_TRANSFER_OWNERSHIP).setAction(async (args, hre) => {
    // override the sign-and-send task to use the appropriate signer
    overrideSignAndSendTask(args.safe, args.onesig, args.signer)

    // call the original task
    return hre.run(TASK_LZ_OWNABLE_TRANSFER_OWNERSHIP, args)
})

wireTask(TASK_STG_WIRE_MESSAGING_DELEGATE).setAction(async (args, hre) => {
    // Here we'll overwrite the configuration tasks just-in-time
    //
    // This is one way of doing this - it has minimal boilerplate but it comes with a downside:
    // if two wire tasks are executed in the same runtime environment (e.g. using hre.run),
    // the task that runs first will overwrite the original subtask definition
    // whereas the task that runs later will overwrite the overwritten task definition
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Configure credit messaging delegate',
        (args: SubtaskConfigureTaskArgs<OAppOmniGraph, IOApp>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureOAppDelegates,
                sdkFactory: createOAppFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

interface ConfigFile {
    name: string
    hashedContent: string
}

task(TASK_STG_GET_CONFIG_HASHES, 'get config for a token')
    .addFlag('genJson', 'Generate also each config as a json file')
    .addParam('stage', 'Chain stage. One of: mainnet, testnet, sandbox', undefined, types.stage, true)
    .setAction(async (args, hre) => {
        let chainsConfigPath: string
        if (args.stage === 'mainnet') {
            chainsConfigPath = path.join(__dirname, '..', 'config', 'mainnet', '01')
        } else if (args.stage === 'testnet') {
            chainsConfigPath = path.join(__dirname, '..', 'config', 'testnet')
        } else if (args.stage === 'sandbox') {
            chainsConfigPath = path.join(__dirname, '..', 'config', 'sandbox')
        } else {
            throw new Error('Invalid stage')
        }

        const logger = createLogger(process.env.LOG_LEVEL || 'info')
        logger.info(`Getting config info for ${args.stage} stage`)

        const directoryPath: string = chainsConfigPath
        const directoryPathJson: string = path.join(chainsConfigPath, 'json')
        const directoryPathJsonHashes: string = path.join(chainsConfigPath, 'hashes')
        try {
            // Read all files in the directory
            const files = fs.readdirSync(directoryPath)

            // Filter for .config.ts files
            const configFiles = files.filter((file) => file.endsWith('.config.ts'))

            // Use Promise.all with map to handle async operations properly
            const output: ConfigFile[] = await Promise.all(
                configFiles.map(async (file) => {
                    const configPath = path.join(directoryPath, file)

                    // Dynamic import the config file
                    const configModule = await import(configPath)

                    // Call the default export function to get the config
                    const config = await configModule.default()

                    // order contracts
                    config.contracts
                        // Step 1: Sort the outer array by contract.eid
                        .sort((a: any, b: any) => a.contract.eid - b.contract.eid)
                        // Step 2: Sort the assets object inside each item (by key)
                        .forEach((item: any) => {
                            if (item.config.assets) {
                                item.config.assets = Object.fromEntries(
                                    Object.entries(item.config.assets).sort(([keyA, valA], [keyB, valB]) =>
                                        valA !== valB
                                            ? (valA as any) - (valB as any)
                                            : (keyA as any).localeCompare(keyB)
                                    )
                                )
                            }
                        })

                    // Step 3: Sort pools by rewarder, then by token
                    config.contracts.forEach((item: any) => {
                        if (item.config.pools) {
                            item.config.pools = Object.entries(item.config.pools)
                                .sort(([, a], [, b]) => {
                                    const rewarderCompare = (a as any).rewarder.localeCompare((b as any).rewarder)
                                    if (rewarderCompare !== 0) return rewarderCompare
                                    return (a as any).token.localeCompare((b as any).token)
                                })
                                .map(([, value]) => value)
                        }
                    })

                    // order connections
                    config.connections.sort((a: any, b: any) => {
                        // Step 1: Sort by from.eid and then to.eid
                        if (a.from.eid !== b.from.eid) {
                            return a.from.eid - b.from.eid // primary sort
                        } else {
                            return a.to.eid - b.to.eid // secondary sort
                        }
                    })

                    // Custom replacer function to handle BigInt serialization
                    const replacer = (key: string, value: any) => {
                        if (typeof value === 'bigint') {
                            return value.toString()
                        }
                        return value
                    }

                    if (args.genJson) {
                        // create folder if it doesn't exist
                        if (!fs.existsSync(directoryPathJson)) {
                            fs.mkdirSync(directoryPathJson, { recursive: true })
                        }
                        // Generate output filename by replacing .config.ts with .config.json and write to json file
                        const outputPath = path.join(directoryPathJson, file.replace('.config.ts', '.config.json'))
                        await fs.promises.writeFile(outputPath, JSON.stringify(config, replacer, 2), 'utf8')
                    }

                    // generate hash
                    const hash = createHash('sha256')
                        .update(JSON.stringify(config, replacer, 2))
                        .digest('hex')

                    return {
                        name: file,
                        hashedContent: hash,
                    }
                })
            )
            if (args.genJson) logger.info(`Wrote config for ${args.stage} stage to ${directoryPathJson}`)

            // create folder if it doesn't exist
            if (!fs.existsSync(directoryPathJsonHashes)) {
                fs.mkdirSync(directoryPathJsonHashes, { recursive: true })
            }
            // store all the hashes in a file
            await fs.promises.writeFile(
                path.join(directoryPathJsonHashes, 'hashes.json'),
                JSON.stringify(output, null, 2)
            )
            logger.info(`Wrote hashes for ${args.stage} stage to ${directoryPathJsonHashes}/hashes.json`)
            return output
        } catch (error) {
            logger.error('Error reading directory:', error)
            return []
        }
    })

/**
 * Task for checking assets are fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_ASSET, 'Check asset')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_ASSET, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Task for checking feelibs are fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_FEELIB_V1, 'Check feelib')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_FEELIB_V1, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Task for checking treasurer is fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_TREASURER, 'Check treasurer')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_TREASURER, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Task for checking staking is fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_STAKING, 'Check staking')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_STAKING, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Task for checking rewarder is fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_REWARDER, 'Check rewarder')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_REWARDER, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Task for checking oft wrapper is fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_OFT_WRAPPER, 'Check OFT Wrapper')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_OFT_WRAPPER, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Task for checking oft credit messaging is fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_CREDIT_MESSAGING, 'Check Credit Messaging')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_CREDIT_MESSAGING, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })

/**
 * Task for checking oft token messaging is fully wired
 * throw an error if there are still pending transactions to wire or if the wiring fails
 */
task(TASK_STG_CHECK_TOKEN_MESSAGING, 'Check Token Messaging')
    .addParam('oappConfig', 'Path to the OApp config file')
    .setAction(async (args, hre) => {
        const result = await hre.run(TASK_STG_WIRE_TOKEN_MESSAGING, {
            ...args,
            dryRun: true,
        })
        // check the result is a success
        return checkResult(result, args.oappConfig)
    })
