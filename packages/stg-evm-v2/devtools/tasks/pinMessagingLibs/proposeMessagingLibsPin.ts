/**
 * Proposes pinning the send/receive message library on all TokenMessaging and CreditMessaging
 * OApps whose current library is still the endpoint default.
 *
 * Strategy to minimise RPC calls:
 *   - Per chain: one call to getRegisteredLibraries + version/type per lib (done once, cached)
 *   - Per (chain, remote) path: one isDefaultSendLibrary check (send only), receive always queued
 *   - Only chains that have at least one path still on default produce transactions
 *   - All transactions proposed in a single OneSig call per run
 *
 * Run in 4 passes:
 *   hardhat stg:propose:pin-messaging-libs --onesig --oapp credit-messaging --lib receive
 *   hardhat stg:propose:pin-messaging-libs --onesig --oapp credit-messaging --lib send
 *   hardhat stg:propose:pin-messaging-libs --onesig --oapp token-messaging  --lib receive
 *   hardhat stg:propose:pin-messaging-libs --onesig --oapp token-messaging  --lib send
 */

import { EXPECTED_MESSAGE_LIB_VERSION } from '@stargatefinance/stg-definitions-v2'
import { task } from 'hardhat/config'

import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createGnosisSignerFactory,
    createProviderFactory,
    getEidForNetworkName,
    getHreByNetworkName,
} from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'
import { createLogger } from '@layerzerolabs/lz-utilities'
import { createEndpointV2Factory } from '@layerzerolabs/protocol-devtools-evm'

import { EndpointV2__factory, IMessageLib__factory } from '../../../ts-src/typechain-types'
import { getChainsThatSupportMessaging, setStage } from '../../config/utils/utils.config'
import { createOneSigSignerFactory } from '../../onesig'
import { TASK_STG_PROPOSE_PIN_MESSAGING_LIBS } from '../constants'

import type { OmniTransaction, SignAndSendResult } from '@layerzerolabs/devtools'
import type { SignerDefinition } from '@layerzerolabs/devtools-evm'
import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

// messageLibType() enum from IMessageLib
const MESSAGE_LIB_TYPE_SEND = 0
const MESSAGE_LIB_TYPE_RECEIVE = 1

const DEPLOYER_SIGNER: SignerDefinition = { type: 'named', name: 'deployer' }

const OAPP_DEPLOYMENT_BY_FLAG: Record<string, string> = {
    'token-messaging': 'TokenMessaging',
    'credit-messaging': 'CreditMessaging',
}

interface PinnedLibs {
    sendLibrary: string
    receiveLibrary: string
}

async function resolveExpectedLibraries(provider: any, endpointAddress: string): Promise<PinnedLibs> {
    const endpoint = EndpointV2__factory.connect(endpointAddress, provider)
    const registered = await endpoint.getRegisteredLibraries()

    const versioned = await Promise.all(
        registered.map(async (address) => {
            const lib = IMessageLib__factory.connect(address, provider)
            const [{ major, minor, endpointVersion }, libType] = await Promise.all([
                lib.version(),
                lib.messageLibType(),
            ])
            return {
                address,
                major: Number(major),
                minor: Number(minor),
                endpointVersion: Number(endpointVersion),
                libType: Number(libType),
            }
        })
    )

    const { major, minor, endpointVersion } = EXPECTED_MESSAGE_LIB_VERSION
    const matching = versioned.filter(
        (l) => l.major === Number(major) && l.minor === minor && l.endpointVersion === endpointVersion
    )

    const sendLib = matching.find((l) => l.libType === MESSAGE_LIB_TYPE_SEND)
    const receiveLib = matching.find((l) => l.libType === MESSAGE_LIB_TYPE_RECEIVE)

    if (!sendLib || !receiveLib) {
        throw new Error(
            `No library matching version ${major}.${minor}.${endpointVersion} on endpoint ${endpointAddress}. ` +
                `Found: ${JSON.stringify(matching)}`
        )
    }

    return { sendLibrary: sendLib.address, receiveLibrary: receiveLib.address }
}

interface TaskArgs {
    safe: boolean
    onesig: boolean
    oapp: string
    lib?: string
    chains?: string
}

task(TASK_STG_PROPOSE_PIN_MESSAGING_LIBS, 'Pin send/receive messaging libs on all OApps still using endpoint default')
    .addFlag('safe', 'Sign with Gnosis Safe')
    .addFlag('onesig', 'Sign with OneSig')
    .addParam('oapp', 'OApp to target: token-messaging or credit-messaging')
    .addOptionalParam('lib', 'Library direction to pin: send, receive, or both (default: both)')
    .addOptionalParam('chains', 'Comma-separated chain names to process (default: all messaging chains)')
    .setAction(async (args: TaskArgs, hre) => {
        if (args.safe === args.onesig) throw new Error('Specify exactly one of --safe or --onesig')
        if (!['token-messaging', 'credit-messaging'].includes(args.oapp))
            throw new Error('--oapp must be token-messaging or credit-messaging')
        if (args.lib !== undefined && !['send', 'receive', 'both'].includes(args.lib))
            throw new Error('--lib must be send, receive, or both')

        const logger = createLogger(process.env.LOG_LEVEL ?? 'info')
        const oappDeployment = OAPP_DEPLOYMENT_BY_FLAG[args.oapp]
        const libTarget = args.lib ?? 'both'
        const pinSend = libTarget === 'send' || libTarget === 'both'
        const pinReceive = libTarget === 'receive' || libTarget === 'both'

        setStage(Stage.MAINNET)

        const allChains = getChainsThatSupportMessaging()
        const chains = args.chains
            ? allChains.filter((c) =>
                  args
                      .chains!.split(',')
                      .map((s) => s.trim())
                      .includes(c.name)
              )
            : allChains

        logger.info(`Pinning ${libTarget}Library on ${oappDeployment} across ${chains.length} chains`)

        const endpointFactory = createEndpointV2Factory(createProviderFactory())
        const transactions: OmniTransaction[] = []

        for (const chain of chains) {
            let hreChain: Awaited<ReturnType<typeof getHreByNetworkName>>
            try {
                hreChain = await getHreByNetworkName(chain.name)
            } catch (e) {
                logger.warn(`[${chain.name}] Could not get HRE, skipping: ${e}`)
                continue
            }

            const eid = getEidForNetworkName(chain.name, hreChain)
            const provider = hreChain.ethers.provider

            let endpointAddress: string
            try {
                endpointAddress = (await hreChain.deployments.get('EndpointV2')).address
            } catch {
                logger.warn(`[${chain.name}] No EndpointV2 deployment, skipping`)
                continue
            }

            let libs: PinnedLibs
            try {
                libs = await resolveExpectedLibraries(provider, endpointAddress)
            } catch (e) {
                logger.warn(`[${chain.name}] Could not resolve expected libs: ${e}`)
                continue
            }

            let oappAddress: string
            try {
                oappAddress = (await hreChain.deployments.get(oappDeployment)).address
            } catch {
                logger.verbose(`[${chain.name}] No ${oappDeployment} deployment, skipping`)
                continue
            }

            const endpointSdk = await endpointFactory({ eid, address: endpointAddress })
            const remoteChains = allChains.filter((c) => c.eid !== chain.eid)

            const pathResults = await Promise.allSettled(
                remoteChains.map(async (remote) => {
                    const isSendDefault = pinSend
                        ? await endpointSdk.isDefaultSendLibrary(oappAddress, remote.eid)
                        : false
                    return { remote, isSendDefault }
                })
            )

            for (const result of pathResults) {
                if (result.status === 'rejected') continue
                const { remote, isSendDefault } = result.value

                if (pinSend && isSendDefault) {
                    const tx = await endpointSdk.setSendLibrary(oappAddress, remote.eid, libs.sendLibrary)
                    transactions.push({
                        ...tx,
                        description: `[${chain.name} → ${remote.name}] ${oappDeployment}: setSendLibrary ${libs.sendLibrary}`,
                    })
                }

                if (pinReceive) {
                    // no isDefaultReceiveLibrary in SDK — always pin; endpoint skips if already set
                    const tx = await endpointSdk.setReceiveLibrary(oappAddress, remote.eid, libs.receiveLibrary, 0n)
                    transactions.push({
                        ...tx,
                        description: `[${chain.name} → ${remote.name}] ${oappDeployment}: setReceiveLibrary ${libs.receiveLibrary}`,
                    })
                }
            }

            logger.info(`[${chain.name}] ${transactions.length} txs accumulated so far`)
        }

        if (transactions.length === 0) {
            logger.info('No transactions needed — all paths already explicitly pinned')
            return
        }

        logger.info(`Total: ${transactions.length} transactions`)

        const createSigner: SignAndSendTaskArgs['createSigner'] = args.safe
            ? createGnosisSignerFactory(DEPLOYER_SIGNER)
            : createOneSigSignerFactory(DEPLOYER_SIGNER)

        const BATCH_SIZE = 1000
        const results: SignAndSendResult[] = []

        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
            const batch = transactions.slice(i, i + BATCH_SIZE)
            const batchNum = Math.floor(i / BATCH_SIZE) + 1
            const totalBatches = Math.ceil(transactions.length / BATCH_SIZE)
            logger.info(`Submitting batch ${batchNum}/${totalBatches} (${batch.length} txs)`)

            const result: SignAndSendResult = await hre.run(SUBTASK_LZ_SIGN_AND_SEND, {
                transactions: batch,
                ci: process.env.CI === 'true',
                createSigner,
            } satisfies SignAndSendTaskArgs)

            results.push(result)
            const [, failed] = result
            if (failed.length > 0) {
                logger.error(`Batch ${batchNum}: ${failed.length} failed`)
                process.exitCode = process.exitCode || 1
            }
        }

        return results
    })
