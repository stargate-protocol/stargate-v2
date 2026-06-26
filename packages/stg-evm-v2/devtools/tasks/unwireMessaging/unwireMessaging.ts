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
    configureMessagingWithoutPeers,
    configureUnpeerEdges,
} from '@stargatefinance/stg-devtools-v2'
import { subtask, task } from 'hardhat/config'

import { type Configurator, OmniTransaction, SignAndSendResult, createConfigureMultiple } from '@layerzerolabs/devtools'
import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createConnectedContractFactory,
    createGnosisSignerFactory,
    createSignerFactory,
    types,
} from '@layerzerolabs/devtools-evm-hardhat'
import { createLogger } from '@layerzerolabs/lz-utilities'
import {
    SUBTASK_LZ_OAPP_CONFIG_LOAD,
    SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
    SubtaskConfigureTaskArgs,
    SubtaskLoadConfigTaskArgs,
    TASK_LZ_OAPP_WIRE,
} from '@layerzerolabs/ua-devtools-evm-hardhat'

import { getContractWithEid } from '../../config/utils'
import { MESSAGING_UNWIRE_CHAIN_ENV } from '../../config/utils/unwire.config.utils'
import { getChainsThatSupportMessaging, setStage } from '../../config/utils/utils.config'
import { createOneSigSignerFactory } from '../../onesig'
import {
    TASK_STG_UNWIRE_CREDIT_MESSAGING,
    TASK_STG_UNWIRE_MESSAGING_BY_EID,
    TASK_STG_UNWIRE_TOKEN_MESSAGING,
} from '../constants'
import { wireTask } from '../wireTaskSetup'

import type { SignerDefinition } from '@layerzerolabs/devtools-evm'
import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

// Directional `from`/`to` unwires only carry sendConfig. Only `both` edges carry receiveConfig and should unpeer.
const isFullUnwireEdge = <TEdge extends { config: { receiveConfig?: unknown } }>(edge: TEdge): boolean =>
    edge.config.receiveConfig != null

const configureTokenMessagingUnpeerFullEdges: Configurator<TokenMessagingOmniGraph, ITokenMessaging> = (
    graph,
    createSdk
) => configureUnpeerEdges({ ...graph, connections: graph.connections.filter(isFullUnwireEdge) }, createSdk)

const configureTokenMessagingUnwire = createConfigureMultiple(
    configureMessagingWithoutPeers,
    configureTokenMessagingUnpeerFullEdges
)

const configureCreditMessagingUnpeerFullEdges: Configurator<CreditMessagingOmniGraph, ICreditMessaging> = (
    graph,
    createSdk
) => configureUnpeerEdges({ ...graph, connections: graph.connections.filter(isFullUnwireEdge) }, createSdk)

const configureCreditMessagingUnwire = createConfigureMultiple(
    configureMessagingWithoutPeers,
    configureCreditMessagingUnpeerFullEdges
)

const withMessagingUnwireChain = async <T>(unwireChain: string, fn: () => Promise<T>): Promise<T> => {
    const chainName = unwireChain.trim()
    if (!chainName) {
        throw new Error('--unwire-chain is required')
    }

    const previous = process.env[MESSAGING_UNWIRE_CHAIN_ENV]
    process.env[MESSAGING_UNWIRE_CHAIN_ENV] = chainName

    try {
        return await fn()
    } finally {
        if (previous === undefined) {
            delete process.env[MESSAGING_UNWIRE_CHAIN_ENV]
        } else {
            process.env[MESSAGING_UNWIRE_CHAIN_ENV] = previous
        }
    }
}

/**
 * Unwire task for token messaging contracts.
 *
 * Reads direction and allowed peers from chainsConfig/<chain>.yml unwire.token_messaging.
 */
wireTask(TASK_STG_UNWIRE_TOKEN_MESSAGING)
    .addParam(
        'unwireChain',
        'Chain name whose chainsConfig unwire.token_messaging section should be applied',
        undefined,
        types.string
    )
    .setAction(async ({ unwireChain, ...args }, hre) => {
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
                    configurator: configureTokenMessagingUnwire,
                    sdkFactory: createTokenMessagingFactory(createConnectedContractFactory()),
                })
        )

        return withMessagingUnwireChain(unwireChain, () => hre.run(TASK_LZ_OAPP_WIRE, args))
    })

/**
 * Unwire task for credit messaging contracts.
 *
 * Reads direction and allowed peers from chainsConfig/<chain>.yml unwire.credit_messaging.
 */
wireTask(TASK_STG_UNWIRE_CREDIT_MESSAGING)
    .addParam(
        'unwireChain',
        'Chain name whose chainsConfig unwire.credit_messaging section should be applied',
        undefined,
        types.string
    )
    .setAction(async ({ unwireChain, ...args }, hre) => {
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
                    configurator: configureCreditMessagingUnwire,
                    sdkFactory: createCreditMessagingFactory(createConnectedContractFactory()),
                })
        )

        return withMessagingUnwireChain(unwireChain, () => hre.run(TASK_LZ_OAPP_WIRE, args))
    })

/**
 * Unpeer a fully-removed chain from all live messaging contracts by EID.
 *
 * Use when a chain has already been scrubbed from definitions (YAML + constant.ts deleted)
 * so the normal graph-based unwire cannot include it. This task iterates all chains
 * currently supporting messaging and calls setPeer(deadEid, bytes32(0)) on both
 * TokenMessaging and CreditMessaging contracts where hasPeer(deadEid, null) = false
 * (i.e. the peer is not yet zeroed out).
 *
 * Usage:
 *   STAGE=mainnet npx hardhat stg:unwire::messaging:by-eid --dead-eids 30318,30101 [--dry-run]
 *   STAGE=mainnet npx hardhat stg:unwire::messaging:by-eid --dead-eids 30318,30101 --onesig
 *   STAGE=mainnet make unwire-chain-by-eid DEAD_EIDS=30318,30101
 */
task(TASK_STG_UNWIRE_MESSAGING_BY_EID)
    .addParam(
        'deadEids',
        'Comma-separated endpoint IDs of chains to unpeer from all live chains',
        undefined,
        types.string
    )
    .addFlag('dryRun', 'Print transactions without sending')
    .addFlag('onesig', 'Use OneSig for signing transactions')
    .addFlag('safe', 'Use Gnosis Safe for signing transactions')
    .addOptionalParam('signer', 'Signer definition (name or index)', undefined, types.json)
    .setAction(
        async (
            {
                deadEids,
                dryRun,
                onesig,
                safe,
                signer,
            }: { deadEids: string; dryRun: boolean; onesig: boolean; safe: boolean; signer: SignerDefinition },
            hre
        ) => {
            if (safe && onesig) throw new Error('--safe and --onesig cannot be used together')

            const logger = createLogger(process.env.LOG_LEVEL ?? 'info')
            const stage = process.env.STAGE
            if (!stage) throw new Error('STAGE env var required (mainnet|testnet|sandbox)')

            setStage(stage as Parameters<typeof setStage>[0])

            const deadEidList = deadEids.split(',').map((s) => {
                const trimmed = s.trim()
                if (!/^\d+$/.test(trimmed)) throw new Error(`Invalid EID: "${trimmed}" — must be a positive integer`)
                return Number(trimmed)
            })

            const liveChains = getChainsThatSupportMessaging()
            const contractFactory = createConnectedContractFactory()
            const tokenMessagingFactory = createTokenMessagingFactory(contractFactory)
            const creditMessagingFactory = createCreditMessagingFactory(contractFactory)

            logger.info(`Unpeering EIDs [${deadEidList.join(', ')}] from ${liveChains.length} live chains`)

            const transactions: OmniTransaction[] = []
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
                            const alreadyUnpeered = await tokenSdk.hasPeer(deadEid, null)
                            if (alreadyUnpeered) {
                                logger.verbose(`[${chain.name}] TokenMessaging: already unpeered from EID ${deadEid}`)
                            } else {
                                transactions.push(await tokenSdk.setPeer(deadEid, null))
                                logger.info(`[${chain.name}] TokenMessaging: queued setPeer(${deadEid}, bytes32(0))`)
                            }
                        } catch (e) {
                            const msg = `[${chain.name}] TokenMessaging: failed for EID ${deadEid} — ${e}`
                            logger.warn(msg)
                            errors.push(msg)
                        }
                    }

                    if (creditSdk) {
                        try {
                            const alreadyUnpeered = await creditSdk.hasPeer(deadEid, null)
                            if (alreadyUnpeered) {
                                logger.verbose(`[${chain.name}] CreditMessaging: already unpeered from EID ${deadEid}`)
                            } else {
                                transactions.push(await creditSdk.setPeer(deadEid, null))
                                logger.info(`[${chain.name}] CreditMessaging: queued setPeer(${deadEid}, bytes32(0))`)
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
                    `${errors.length} error(s) while collecting transactions for EIDs [${deadEidList.join(', ')}]:\n${errors.join('\n')}`
                )
            }

            logger.info(`Collected ${transactions.length} transaction(s) to submit`)

            if (dryRun) {
                logger.info(`Dry run — transactions not submitted:`)
                for (const tx of transactions) {
                    logger.info(
                        `  ${JSON.stringify(tx, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))}`
                    )
                }
                return
            }

            if (transactions.length === 0) {
                logger.info(`No transactions needed — all EIDs already unpeered`)
                return
            }

            const createSigner: SignAndSendTaskArgs['createSigner'] = safe
                ? createGnosisSignerFactory(signer)
                : onesig
                  ? createOneSigSignerFactory(signer)
                  : createSignerFactory(signer)

            const [, failed]: SignAndSendResult = await hre.run(SUBTASK_LZ_SIGN_AND_SEND, {
                transactions,
                ci: process.env.CI === 'true',
                createSigner,
            } satisfies SignAndSendTaskArgs)

            if (failed.length > 0) {
                throw new Error(`${failed.length} transaction(s) failed to send`)
            }

            logger.info(`Done unpeering EIDs [${deadEidList.join(', ')}]`)
        }
    )
