import {
    CreditMessagingOmniGraphHardhatSchema,
    TokenMessagingOmniGraphHardhatSchema,
    createCreditMessagingFactory,
    createTokenMessagingFactory,
} from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    CreditMessagingOmniGraph,
    ICreditMessaging,
    ITokenMessaging,
    TokenMessagingOmniGraph,
    configureCreditMessaging,
    configureTokenMessaging,
    configureUnpeerEdges,
} from '@stargatefinance/stg-devtools-v2'
import { subtask, task } from 'hardhat/config'

import { createConfigureMultiple } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, inheritTask, types } from '@layerzerolabs/devtools-evm-hardhat'
import { createLogger } from '@layerzerolabs/lz-utilities'
import {
    SUBTASK_LZ_OAPP_CONFIG_LOAD,
    SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
    SubtaskConfigureTaskArgs,
    SubtaskLoadConfigTaskArgs,
    TASK_LZ_OAPP_WIRE,
} from '@layerzerolabs/ua-devtools-evm-hardhat'

import { getContractWithEid } from '../../config/utils'
import { getChainsThatSupportMessaging, setStage } from '../../config/utils/utils.config'
import {
    TASK_STG_UNWIRE_CREDIT_MESSAGING,
    TASK_STG_UNWIRE_MESSAGING_BY_EID,
    TASK_STG_UNWIRE_TOKEN_MESSAGING,
} from '../constants'

const wireTask = inheritTask(TASK_LZ_OAPP_WIRE)

/**
 * Full unwire task for token messaging contracts.
 *
 * Runs both steps in a single pass over the unwire config:
 *   1. configureTokenMessaging — sets executor to zero address and DVN to DeadDVN
 *   2. configureUnpeerEdges    — calls setPeer(eid, bytes32(0)) to remove peer relationships
 *
 * Use with a token-messaging.unwire.config.ts that defines the edges to disable.
 */
wireTask(TASK_STG_UNWIRE_TOKEN_MESSAGING).setAction(async (args, hre) => {
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load token messaging unwire config',
        (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
            runSuper({
                ...args,
                schema: TokenMessagingOmniGraphHardhatSchema,
            })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Unwire token messaging: disable executor/DVN and remove peers',
        (args: SubtaskConfigureTaskArgs<TokenMessagingOmniGraph, ITokenMessaging>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: createConfigureMultiple(configureTokenMessaging, configureUnpeerEdges),
                sdkFactory: createTokenMessagingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Full unwire task for credit messaging contracts.
 *
 * Runs both steps in a single pass over the unwire config:
 *   1. configureCreditMessaging — sets executor to zero address and DVN to DeadDVN
 *   2. configureUnpeerEdges     — calls setPeer(eid, bytes32(0)) to remove peer relationships
 *
 * Use with a credit-messaging.unwire.config.ts that defines the edges to disable.
 */
wireTask(TASK_STG_UNWIRE_CREDIT_MESSAGING).setAction(async (args, hre) => {
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load credit messaging unwire config',
        (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
            runSuper({
                ...args,
                schema: CreditMessagingOmniGraphHardhatSchema,
            })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Unwire credit messaging: disable executor/DVN and remove peers',
        (args: SubtaskConfigureTaskArgs<CreditMessagingOmniGraph, ICreditMessaging>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: createConfigureMultiple(configureCreditMessaging, configureUnpeerEdges),
                sdkFactory: createCreditMessagingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Unpeer a fully-removed chain from all live messaging contracts by EID.
 *
 * Use when a chain has already been scrubbed from definitions (YAML + constant.ts deleted)
 * so the normal graph-based unwire cannot include it. This task iterates all chains
 * currently supporting messaging and calls setPeer(deadEid, bytes32(0)) on both
 * TokenMessaging and CreditMessaging contracts where the peer is still set.
 *
 * Usage: STAGE=mainnet npx hardhat stg:unwire::messaging:by-eid --dead-eid <eid> [--dry-run]
 */
task(TASK_STG_UNWIRE_MESSAGING_BY_EID)
    .addParam('deadEid', 'Endpoint ID of the chain to unpeer from all live chains', undefined, types.int)
    .addFlag('dryRun', 'Print transactions without sending')
    .setAction(async ({ deadEid, dryRun }: { deadEid: number; dryRun: boolean }, hre) => {
        const logger = createLogger(process.env.LOG_LEVEL ?? 'info')
        const stage = process.env.STAGE
        if (!stage) throw new Error('STAGE env var required (mainnet|testnet|sandbox)')

        setStage(stage as Parameters<typeof setStage>[0])

        const liveChains = getChainsThatSupportMessaging()
        const contractFactory = createConnectedContractFactory()
        const tokenMessagingFactory = createTokenMessagingFactory(contractFactory)
        const creditMessagingFactory = createCreditMessagingFactory(contractFactory)

        logger.info(`Unpeering EID ${deadEid} from ${liveChains.length} live chains`)

        for (const chain of liveChains) {
            const point = getContractWithEid(chain.eid, { contractName: 'TokenMessaging' })
            const creditPoint = getContractWithEid(chain.eid, { contractName: 'CreditMessaging' })

            // TokenMessaging
            try {
                const tokenSdk = await tokenMessagingFactory(point)
                const alreadyUnpeeredToken = await tokenSdk.hasPeer(deadEid, null)
                if (alreadyUnpeeredToken) {
                    logger.verbose(`[${chain.name}] TokenMessaging: already unpeered`)
                } else if (dryRun) {
                    logger.info(`[${chain.name}] TokenMessaging: would setPeer(${deadEid}, bytes32(0))`)
                } else {
                    const tx = await tokenSdk.setPeer(deadEid, null)
                    logger.info(`[${chain.name}] TokenMessaging: setPeer tx ${JSON.stringify(tx)}`)
                }
            } catch (e) {
                logger.warn(`[${chain.name}] TokenMessaging: failed — ${e}`)
            }

            // CreditMessaging
            try {
                const creditSdk = await creditMessagingFactory(creditPoint)
                const alreadyUnpeeredCredit = await creditSdk.hasPeer(deadEid, null)
                if (alreadyUnpeeredCredit) {
                    logger.verbose(`[${chain.name}] CreditMessaging: already unpeered`)
                } else if (dryRun) {
                    logger.info(`[${chain.name}] CreditMessaging: would setPeer(${deadEid}, bytes32(0))`)
                } else {
                    const tx = await creditSdk.setPeer(deadEid, null)
                    logger.info(`[${chain.name}] CreditMessaging: setPeer tx ${JSON.stringify(tx)}`)
                }
            } catch (e) {
                logger.warn(`[${chain.name}] CreditMessaging: failed — ${e}`)
            }
        }

        logger.info(`Done unpeering EID ${deadEid}`)
    })
