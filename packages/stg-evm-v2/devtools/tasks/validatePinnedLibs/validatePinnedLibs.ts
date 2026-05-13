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
import {
    MAX_CHAIN_RETRIES,
    PinnedLibs,
    RETRY_DELAY_MS,
    resolveExpectedLibraries,
    withRetry,
} from '../pinMessagingLibs/expectedLibraries'

const STAGE_BY_FLAG: Record<string, Stage> = {
    mainnet: Stage.MAINNET,
    testnet: Stage.TESTNET,
    sandbox: Stage.SANDBOX,
}

const OAPP_DEPLOYMENTS = ['TokenMessaging', 'CreditMessaging'] as const

interface TaskArgs {
    stage: string
    chains?: string
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
    .setAction(async (args: TaskArgs) => {
        const stage = STAGE_BY_FLAG[args.stage]
        if (stage === undefined) throw new Error(`--stage must be one of: ${Object.keys(STAGE_BY_FLAG).join(', ')}`)

        const logger = createLogger(process.env.LOG_LEVEL ?? 'info')
        setStage(stage)

        const allChains = getChainsThatSupportMessaging()
        const chains = args.chains
            ? allChains.filter((c) =>
                  args
                      .chains!.split(',')
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

        for (const chain of chains) {
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
                    message: `Could not get HRE after ${MAX_CHAIN_RETRIES} attempts: ${(e as Error).message}`,
                })
                continue
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
                    message: `No EndpointV2 deployment after ${MAX_CHAIN_RETRIES} attempts: ${(e as Error).message}`,
                })
                continue
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
                    message: `Could not resolve expected libraries: ${(e as Error).message}`,
                })
                continue
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
                            message: `${oappDeployment}→${remote.name}(eid=${remote.eid}): ${(result.reason as Error).message}`,
                        })
                        continue
                    }

                    const { isDefaultSend, sendLib, receiveLib, isDefaultReceive } = result.value
                    checkedPaths++

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
                    }
                }
            }

            logger.info(
                `[${chain.name}] checked, running totals: ${mismatches.length} mismatches, ${checkedPaths} paths`
            )
        }

        if (chainErrors.length > 0) {
            logger.error(`Encountered ${chainErrors.length} per-chain error(s):`)
            for (const err of chainErrors) {
                const endpointSuffix = err.endpoint ? ` endpoint=${err.endpoint}` : ''
                logger.error(`  [${err.chain} eid=${err.eid}${endpointSuffix}] ${err.message}`)
            }
        }

        if (mismatches.length > 0) {
            logger.error(`Found ${mismatches.length} library pin mismatch(es):`)
            for (const m of mismatches) {
                logger.error(
                    `  [${m.chain} eid=${m.eid}] ${m.oapp}→${m.remoteChain}(eid=${m.remoteEid}) ${m.direction}: actual=${m.actual} expected=${m.expected} reason=${m.reason}`
                )
            }
        }

        if (mismatches.length === 0 && chainErrors.length === 0) {
            logger.info(
                `[OK] All messaging libs pinned to expected version (${checkedPaths} paths across ${chains.length} chain(s))`
            )
            return
        }

        process.exitCode = 1
    })
