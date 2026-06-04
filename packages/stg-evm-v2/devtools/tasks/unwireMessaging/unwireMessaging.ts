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
import { createConnectedContractFactory, types } from '@layerzerolabs/devtools-evm-hardhat'
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
import { wireTask } from '../wireTaskSetup'

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
 * TokenMessaging and CreditMessaging contracts where hasPeer(deadEid, null) = true
 * (i.e. the peer is not yet zeroed out).
 *
 * Usage: STAGE=mainnet npx hardhat stg:unwire::messaging:by-eid --dead-eids 30318,30101 [--dry-run]
 */
task(TASK_STG_UNWIRE_MESSAGING_BY_EID)
    .addParam(
        'deadEids',
        'Comma-separated endpoint IDs of chains to unpeer from all live chains',
        undefined,
        types.string
    )
    .addFlag('dryRun', 'Print transactions without sending')
    .setAction(async ({ deadEids, dryRun }: { deadEids: string; dryRun: boolean }, hre) => {
        const logger = createLogger(process.env.LOG_LEVEL ?? 'info')
        const stage = process.env.STAGE
        if (!stage) throw new Error('STAGE env var required (mainnet|testnet|sandbox)')

        setStage(stage as Parameters<typeof setStage>[0])

        const deadEidList = deadEids.split(',').map((s) => {
            const eid = parseInt(s.trim(), 10)
            if (isNaN(eid)) throw new Error(`Invalid EID: "${s.trim()}"`)
            return eid
        })

        const liveChains = getChainsThatSupportMessaging()
        const contractFactory = createConnectedContractFactory()
        const tokenMessagingFactory = createTokenMessagingFactory(contractFactory)
        const creditMessagingFactory = createCreditMessagingFactory(contractFactory)

        logger.info(`Unpeering EIDs [${deadEidList.join(', ')}] from ${liveChains.length} live chains`)

        const errors: string[] = []

        for (const chain of liveChains) {
            const point = getContractWithEid(chain.eid, { contractName: 'TokenMessaging' })
            const creditPoint = getContractWithEid(chain.eid, { contractName: 'CreditMessaging' })

            // Create SDKs once per chain, shared across all dead EIDs
            let tokenSdk: Awaited<ReturnType<typeof tokenMessagingFactory>> | undefined
            let creditSdk: Awaited<ReturnType<typeof creditMessagingFactory>> | undefined
            try {
                tokenSdk = await tokenMessagingFactory(point)
            } catch (e) {
                const msg = `[${chain.name}] TokenMessaging: failed to create SDK — ${e}`
                logger.warn(msg)
                errors.push(msg)
            }
            try {
                creditSdk = await creditMessagingFactory(creditPoint)
            } catch (e) {
                const msg = `[${chain.name}] CreditMessaging: failed to create SDK — ${e}`
                logger.warn(msg)
                errors.push(msg)
            }

            for (const deadEid of deadEidList) {
                if (tokenSdk) {
                    try {
                        const alreadyUnpeeredToken = await tokenSdk.hasPeer(deadEid, null)
                        if (alreadyUnpeeredToken) {
                            logger.verbose(`[${chain.name}] TokenMessaging: already unpeered from EID ${deadEid}`)
                        } else if (dryRun) {
                            logger.info(`[${chain.name}] TokenMessaging: would setPeer(${deadEid}, bytes32(0))`)
                        } else {
                            const tx = await tokenSdk.setPeer(deadEid, null)
                            logger.info(
                                `[${chain.name}] TokenMessaging: setPeer(${deadEid}) tx ${JSON.stringify(tx, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))}`
                            )
                        }
                    } catch (e) {
                        const msg = `[${chain.name}] TokenMessaging: failed for EID ${deadEid} — ${e}`
                        logger.warn(msg)
                        errors.push(msg)
                    }
                }

                if (creditSdk) {
                    try {
                        const alreadyUnpeeredCredit = await creditSdk.hasPeer(deadEid, null)
                        if (alreadyUnpeeredCredit) {
                            logger.verbose(`[${chain.name}] CreditMessaging: already unpeered from EID ${deadEid}`)
                        } else if (dryRun) {
                            logger.info(`[${chain.name}] CreditMessaging: would setPeer(${deadEid}, bytes32(0))`)
                        } else {
                            const tx = await creditSdk.setPeer(deadEid, null)
                            logger.info(
                                `[${chain.name}] CreditMessaging: setPeer(${deadEid}) tx ${JSON.stringify(tx, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))}`
                            )
                        }
                    } catch (e) {
                        const msg = `[${chain.name}] CreditMessaging: failed for EID ${deadEid} — ${e}`
                        logger.warn(msg)
                        errors.push(msg)
                    }
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(
                `${errors.length} error(s) while unpeering EIDs [${deadEidList.join(', ')}]:\n${errors.join('\n')}`
            )
        }

        logger.info(`Done unpeering EIDs [${deadEidList.join(', ')}]`)
    })
