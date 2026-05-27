/**
 * Validates that every (chain, remote-eid) pair on TokenMessaging and CreditMessaging
 * has its send/receive library explicitly pinned to EXPECTED_MESSAGE_LIB_VERSION.
 *
 * A path counts as pinned iff:
 *   - isDefaultSendLibrary(oapp, remote) === false
 *   - getSendLibrary(oapp, remote) === expected.sendLibrary
 *   - getReceiveLibrary(oapp, remote).isDefault === false
 *   - getReceiveLibrary(oapp, remote).lib === expected.receiveLibrary
 *
 * Anything else is a mismatch. Exit code is non-zero if any mismatches or
 * unrecoverable per-chain errors are recorded.
 */

import { task } from 'hardhat/config'

import { getHreByNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'
import { createLogger } from '@layerzerolabs/lz-utilities'

import { getChainsThatSupportMessaging, setStage } from '../../config/utils/utils.config'
import { TASK_STG_VALIDATE_PINNED_LIBS } from '../constants'

import { MAX_CHAIN_RETRIES, PinnedLibs, RETRY_DELAY_MS, resolveExpectedLibraries, withRetry } from './expectedLibraries'

const STAGE_BY_FLAG: Record<string, Stage> = {
    mainnet: Stage.MAINNET,
    testnet: Stage.TESTNET,
    sandbox: Stage.SANDBOX,
}

const OAPP_DEPLOYMENTS = ['TokenMessaging', 'CreditMessaging'] as const

const CHAIN_CONCURRENCY = 10

async function runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>
): Promise<void> {
    let nextIndex = 0
    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (nextIndex < items.length) {
            const i = nextIndex++
            await worker(items[i])
        }
    })
    await Promise.all(runners)
}

function summarizeError(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e)
    const name = raw.match(/"name":"(\w+)"/)
    if (name) return name[1]
    const code = raw.match(/\bcode=([A-Z_]+)/)
    if (code) return code[1]
    return raw.split('\n')[0].slice(0, 160)
}

interface TaskArgs {
    stage: string
    chains?: string
    verboseErrors?: boolean
}

interface Mismatch {
    chain: string
    eid: number
    oapp: string
    remoteChain: string
    remoteEid: number
    direction: 'send' | 'receive'
    actual: string
    expected: string
    reason: string
}

interface ChainError {
    chain: string
    eid: number
    endpoint?: string
    message: string
}

task(TASK_STG_VALIDATE_PINNED_LIBS, 'Validate that messaging libs are pinned to expected version on all chains')
    .addParam('stage', 'mainnet | testnet | sandbox')
    .addOptionalParam('chains', 'Comma-separated chain names to validate (default: all messaging chains)')
    .addFlag('verboseErrors', 'Print full per-pair error messages instead of just bucketed counts')
    .setAction(async (args: TaskArgs) => {
        const stage = STAGE_BY_FLAG[args.stage]
        if (stage === undefined) throw new Error(`--stage must be one of: ${Object.keys(STAGE_BY_FLAG).join(', ')}`)

        const logger = createLogger(process.env.LOG_LEVEL ?? 'info')
        setStage(stage)

        const allChains = getChainsThatSupportMessaging()
        const chainsFilter = args.chains
        const chains = chainsFilter
            ? allChains.filter((c) =>
                  chainsFilter
                      .split(',')
                      .map((s) => s.trim())
                      .includes(c.name)
              )
            : allChains

        if (chains.length === 0) {
            logger.warn('No chains selected — nothing to validate')
            return
        }

        const { EndpointV2__factory } = await import('../../../ts-src/typechain-types')

        logger.info(`Validating pinned messaging libs on ${chains.length} chain(s) for stage=${args.stage}`)

        const mismatches: Mismatch[] = []
        const chainErrors: ChainError[] = []
        let checkedPaths = 0

        await runWithConcurrency(chains, CHAIN_CONCURRENCY, async (chain) => {
            const chainStartedAt = Date.now()
            let chainCheckedPaths = 0
            let chainMismatchCount = 0
            let chainErrorCount = 0

            const finish = (note?: string) => {
                const seconds = ((Date.now() - chainStartedAt) / 1000).toFixed(1)
                const parts = [`${chainCheckedPaths} paths checked`]
                if (chainMismatchCount) parts.push(`${chainMismatchCount} mismatch(es)`)
                if (chainErrorCount) parts.push(`${chainErrorCount} error(s)`)
                if (note) parts.push(note)
                logger.info(`[${chain.name}] done in ${seconds}s — ${parts.join(', ')}`)
            }

            let hreChain: Awaited<ReturnType<typeof getHreByNetworkName>>
            try {
                hreChain = await withRetry(
                    async () => getHreByNetworkName(chain.name),
                    MAX_CHAIN_RETRIES,
                    RETRY_DELAY_MS
                )
            } catch (e) {
                chainErrors.push({
                    chain: chain.name,
                    eid: Number(chain.eid),
                    message: `Could not get HRE: ${summarizeError(e)}`,
                })
                chainErrorCount++
                finish('fatal: could not get HRE')
                return
            }

            let endpointAddress: string
            try {
                endpointAddress = (
                    await withRetry(() => hreChain.deployments.get('EndpointV2'), MAX_CHAIN_RETRIES, RETRY_DELAY_MS)
                ).address
            } catch (e) {
                chainErrors.push({
                    chain: chain.name,
                    eid: Number(chain.eid),
                    message: `No EndpointV2 deployment: ${summarizeError(e)}`,
                })
                chainErrorCount++
                finish('fatal: no EndpointV2 deployment')
                return
            }

            const provider = hreChain.ethers.provider

            let expected: PinnedLibs
            try {
                expected = await withRetry(
                    () => resolveExpectedLibraries(provider, endpointAddress),
                    MAX_CHAIN_RETRIES,
                    RETRY_DELAY_MS
                )
            } catch (e) {
                chainErrors.push({
                    chain: chain.name,
                    eid: Number(chain.eid),
                    endpoint: endpointAddress,
                    message: `Could not resolve expected libraries: ${summarizeError(e)}`,
                })
                chainErrorCount++
                finish('fatal: could not resolve expected libraries')
                return
            }

            const endpoint = EndpointV2__factory.connect(endpointAddress, provider)
            const remotes = allChains.filter((c) => c.eid !== chain.eid)

            for (const oappDeployment of OAPP_DEPLOYMENTS) {
                let oappAddress: string
                try {
                    oappAddress = (
                        await withRetry(
                            () => hreChain.deployments.get(oappDeployment),
                            MAX_CHAIN_RETRIES,
                            RETRY_DELAY_MS
                        )
                    ).address
                } catch {
                    logger.verbose(`[${chain.name}] No ${oappDeployment} deployment, skipping`)
                    continue
                }

                const results = await Promise.allSettled(
                    remotes.map(async (remote) => {
                        const [isDefaultSend, sendLib, receive] = await Promise.all([
                            endpoint.isDefaultSendLibrary(oappAddress, remote.eid),
                            endpoint.getSendLibrary(oappAddress, remote.eid),
                            endpoint.getReceiveLibrary(oappAddress, remote.eid),
                        ])
                        const [receiveLib, isDefaultReceive] = receive as unknown as [string, boolean]
                        return { remote, isDefaultSend, sendLib, receiveLib, isDefaultReceive }
                    })
                )

                for (let i = 0; i < results.length; i++) {
                    const result = results[i]
                    const remote = remotes[i]
                    if (result.status === 'rejected') {
                        chainErrors.push({
                            chain: chain.name,
                            eid: Number(chain.eid),
                            endpoint: endpointAddress,
                            message: `${oappDeployment}→${remote.name}(eid=${remote.eid}): ${summarizeError(result.reason)}`,
                        })
                        chainErrorCount++
                        continue
                    }

                    const { isDefaultSend, sendLib, receiveLib, isDefaultReceive } = result.value
                    checkedPaths++
                    chainCheckedPaths++

                    if (isDefaultSend) {
                        mismatches.push({
                            chain: chain.name,
                            eid: Number(chain.eid),
                            oapp: oappDeployment,
                            remoteChain: remote.name,
                            remoteEid: Number(remote.eid),
                            direction: 'send',
                            actual: sendLib,
                            expected: expected.sendLibrary,
                            reason: 'using-endpoint-default',
                        })
                        chainMismatchCount++
                    } else if (sendLib.toLowerCase() !== expected.sendLibrary.toLowerCase()) {
                        mismatches.push({
                            chain: chain.name,
                            eid: Number(chain.eid),
                            oapp: oappDeployment,
                            remoteChain: remote.name,
                            remoteEid: Number(remote.eid),
                            direction: 'send',
                            actual: sendLib,
                            expected: expected.sendLibrary,
                            reason: 'wrong-address',
                        })
                        chainMismatchCount++
                    }

                    if (isDefaultReceive) {
                        mismatches.push({
                            chain: chain.name,
                            eid: Number(chain.eid),
                            oapp: oappDeployment,
                            remoteChain: remote.name,
                            remoteEid: Number(remote.eid),
                            direction: 'receive',
                            actual: receiveLib,
                            expected: expected.receiveLibrary,
                            reason: 'using-endpoint-default',
                        })
                        chainMismatchCount++
                    } else if (receiveLib.toLowerCase() !== expected.receiveLibrary.toLowerCase()) {
                        mismatches.push({
                            chain: chain.name,
                            eid: Number(chain.eid),
                            oapp: oappDeployment,
                            remoteChain: remote.name,
                            remoteEid: Number(remote.eid),
                            direction: 'receive',
                            actual: receiveLib,
                            expected: expected.receiveLibrary,
                            reason: 'wrong-address',
                        })
                        chainMismatchCount++
                    }
                }
            }

            finish()
        })

        const mismatchesByChain = new Map<string, Mismatch[]>()
        for (const m of mismatches) {
            const key = `${m.chain} eid=${m.eid}`
            const list = mismatchesByChain.get(key) ?? []
            list.push(m)
            mismatchesByChain.set(key, list)
        }

        const errorsByChain = new Map<string, ChainError[]>()
        for (const err of chainErrors) {
            const key = `${err.chain} eid=${err.eid}`
            const list = errorsByChain.get(key) ?? []
            list.push(err)
            errorsByChain.set(key, list)
        }

        logger.info('')
        logger.info('========== Summary ==========')
        logger.info(`Chains scanned:         ${chains.length}`)
        logger.info(`Paths checked:          ${checkedPaths}`)
        logger.info(`Chains with mismatches: ${mismatchesByChain.size} (${mismatches.length} total)`)
        logger.info(`Chains with errors:     ${errorsByChain.size} (${chainErrors.length} total)`)
        logger.info('')

        if (mismatchesByChain.size > 0) {
            const lines: string[] = [`Mismatches by chain (${mismatchesByChain.size}):`]
            for (const [chainKey, list] of mismatchesByChain) {
                lines.push(`  [${chainKey}] ${list.length} mismatch(es)`)
                for (const m of list) {
                    const detail =
                        m.reason === 'using-endpoint-default'
                            ? 'using endpoint default (not explicitly pinned)'
                            : `actual=${m.actual} expected=${m.expected} (wrong-address)`
                    lines.push(`    ${m.oapp}→${m.remoteChain}(eid=${m.remoteEid}) ${m.direction}: ${detail}`)
                }
            }
            logger.error(lines.join('\n'))
        }

        if (errorsByChain.size > 0) {
            const lines: string[] = [`Errors by chain (${errorsByChain.size}):`]
            for (const [chainKey, errs] of errorsByChain) {
                const buckets = new Map<string, number>()
                for (const err of errs) {
                    const tail = err.message.match(/:\s*(.+)$/)
                    const reason = tail ? tail[1] : err.message
                    buckets.set(reason, (buckets.get(reason) ?? 0) + 1)
                }
                const summary = [...buckets.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([reason, n]) => `${n}× ${reason}`)
                    .join(', ')
                lines.push(`  [${chainKey}] ${errs.length} error(s): ${summary}`)
                if (args.verboseErrors) {
                    for (const err of errs) {
                        lines.push(`    ${err.message}`)
                    }
                }
            }
            logger.error(lines.join('\n'))
        }

        if (mismatches.length === 0 && chainErrors.length === 0) {
            logger.info(
                `[OK] All messaging libs pinned to expected version (${checkedPaths} paths across ${chains.length} chain(s))`
            )
            return
        }

        process.exitCode = 1
    })
