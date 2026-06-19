import { createCreditMessagingFactory, createTokenMessagingFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { task } from 'hardhat/config'

import { createConnectedContractFactory } from '@layerzerolabs/devtools-evm-hardhat'
import { createLogger } from '@layerzerolabs/lz-utilities'

import { getContractWithEid } from '../../config/utils'
import { getChainsThatSupportMessaging, setStage } from '../../config/utils/utils.config'
import { TASK_STG_CHECK_MESSAGING_DISCONNECTED } from '../constants'

import { loadDisconnectedCheckConfig } from './config'

const GREEN = (s: string) => `\x1b[32m${s}\x1b[0m`
const YELLOW = (s: string) => `\x1b[33m${s}\x1b[0m`

interface ChainConnectionStatus {
    activeChain: string
    deprecatedEid: number
    tokenMessaging: 'disconnected' | 'still-peered' | 'error'
    creditMessaging: 'disconnected' | 'still-peered' | 'error'
}

/**
 * Verifies that deprecated chains are fully disconnected from all active chains.
 *
 * Reads deprecated EIDs and optional active chain list from the current stage's
 * chainsConfig/unwire directory.
 *
 * Deprecated chains are identified by EID because their chainsConfig/*.yml or
 * deployment artifacts may no longer be present.
 *
 * For each deprecated EID, checks every active chain's TokenMessaging and CreditMessaging
 * contracts to confirm hasPeer(deprecatedEid, null) = true (peer is bytes32(0)).
 *
 * Exits with a non-zero code if any peer relationship is still active.
 *
 * Usage:
 *   # default — progress line per chain + final report
 *   STAGE=mainnet make check-messaging-disconnected
 *
 *   # logs — per-chain per-EID status during checks
 *   STAGE=mainnet make check-messaging-disconnected CONFIGURE_ARGS_COMMON=--logs
 */
task(TASK_STG_CHECK_MESSAGING_DISCONNECTED, 'Verify deprecated chains are disconnected from all active chains')
    .addFlag('logs', 'Print per-chain per-EID status as checks run')
    .setAction(async ({ logs }: { logs: boolean }, hre) => {
        const logger = createLogger(process.env.LOG_LEVEL ?? 'info')
        const stage = process.env.STAGE
        if (!stage) throw new Error('STAGE env var required (mainnet|testnet|sandbox)')

        setStage(stage as Parameters<typeof setStage>[0])

        const { deprecatedEids, activeChains, configPath } = loadDisconnectedCheckConfig()
        logger.info(`Loaded disconnected check config from ${configPath}`)

        const allLiveChains = getChainsThatSupportMessaging()

        const chainsToCheck =
            activeChains == null
                ? allLiveChains
                : (() => {
                      const requested = new Set(activeChains)
                      const matched = allLiveChains.filter((c) => requested.has(c.name))
                      const unmatched = [...requested].filter((name) => !allLiveChains.some((c) => c.name === name))
                      if (unmatched.length > 0) {
                          throw new Error(`Unknown active_chains in config: ${unmatched.join(', ')}`)
                      }
                      return matched
                  })()

        logger.info(
            `Checking ${deprecatedEids.length} deprecated EID(s) against ${chainsToCheck.length} active chain(s)`
        )

        const contractFactory = createConnectedContractFactory()
        const tokenMessagingFactory = createTokenMessagingFactory(contractFactory)
        const creditMessagingFactory = createCreditMessagingFactory(contractFactory)

        const results: ChainConnectionStatus[] = []
        const errors: string[] = []

        for (const [chainIndex, chain] of chainsToCheck.entries()) {
            logger.info(`[${chainIndex + 1}/${chainsToCheck.length}] Checking ${chain.name}...`)
            const tokenPoint = getContractWithEid(chain.eid, { contractName: 'TokenMessaging' })
            const creditPoint = getContractWithEid(chain.eid, { contractName: 'CreditMessaging' })

            // Create SDKs once per chain, shared across all deprecated EIDs
            let tokenSdk: Awaited<ReturnType<typeof tokenMessagingFactory>> | undefined
            let creditSdk: Awaited<ReturnType<typeof creditMessagingFactory>> | undefined
            try {
                tokenSdk = await tokenMessagingFactory(tokenPoint)
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

            for (const { eid: deprecatedEid, chain: deprecatedChain } of deprecatedEids) {
                if (logs) logger.info(`  EID ${deprecatedEid} (${deprecatedChain}):`)
                let tokenStatus: ChainConnectionStatus['tokenMessaging'] = 'error'
                let creditStatus: ChainConnectionStatus['creditMessaging'] = 'error'

                if (tokenSdk) {
                    try {
                        const tokenUnpeered = await tokenSdk.hasPeer(deprecatedEid, null)
                        tokenStatus = tokenUnpeered ? 'disconnected' : 'still-peered'
                        if (logs)
                            logger.info(
                                `    TokenMessaging:  ${tokenUnpeered ? GREEN('✓ disconnected') : YELLOW('✗ still-peered')}`
                            )
                    } catch (e) {
                        const msg = `[${chain.name}] TokenMessaging check failed for EID ${deprecatedEid}: ${e}`
                        logger.warn(msg)
                        errors.push(msg)
                    }
                }

                if (creditSdk) {
                    try {
                        const creditUnpeered = await creditSdk.hasPeer(deprecatedEid, null)
                        creditStatus = creditUnpeered ? 'disconnected' : 'still-peered'
                        if (logs)
                            logger.info(
                                `    CreditMessaging: ${creditUnpeered ? GREEN('✓ disconnected') : YELLOW('✗ still-peered')}`
                            )
                    } catch (e) {
                        const msg = `[${chain.name}] CreditMessaging check failed for EID ${deprecatedEid}: ${e}`
                        logger.warn(msg)
                        errors.push(msg)
                    }
                }

                results.push({
                    activeChain: chain.name,
                    deprecatedEid,
                    tokenMessaging: tokenStatus,
                    creditMessaging: creditStatus,
                })
            }
        }

        const stillPeered = results.filter(
            (r) => r.tokenMessaging === 'still-peered' || r.creditMessaging === 'still-peered'
        )
        const successes = results.filter(
            (r) => r.tokenMessaging === 'disconnected' && r.creditMessaging === 'disconnected'
        )

        logger.info(`\n=== Disconnection Check Results ===`)
        logger.info(GREEN(`✓ Fully disconnected: ${successes.length} / ${results.length}`))

        if (stillPeered.length > 0) {
            logger.info(YELLOW(`✗ Still peered: ${stillPeered.length} / ${results.length}\n`))

            // Group by deprecated EID for readability
            const byEid = new Map<number, ChainConnectionStatus[]>()
            for (const r of stillPeered) {
                const group = byEid.get(r.deprecatedEid) ?? []
                group.push(r)
                byEid.set(r.deprecatedEid, group)
            }

            for (const [eid, group] of byEid.entries()) {
                logger.info(YELLOW(`  EID ${eid} still peered on ${group.length} chain(s):`))
                for (const r of group) {
                    const token = r.tokenMessaging === 'disconnected' ? GREEN('✓') : YELLOW('✗')
                    const credit = r.creditMessaging === 'disconnected' ? GREEN('✓') : YELLOW('✗')
                    logger.info(`    ${r.activeChain} — TokenMessaging: ${token}  CreditMessaging: ${credit}`)
                }
            }

            throw new Error(
                `${stillPeered.length} peer relationship(s) still active. Run unwire-chain-mainnet or unwire-chain-by-eid to remove them.`
            )
        }

        if (errors.length > 0) {
            throw new Error(`${errors.length} check error(s) occurred:\n${errors.join('\n')}`)
        }

        logger.info(GREEN(`\nAll deprecated EIDs are fully disconnected from all active chains.`))
    })
