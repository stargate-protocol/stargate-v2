import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import { ethers } from 'ethers'
import { run } from 'hardhat'

import { type OmniTransaction, type SignAndSendResult } from '@layerzerolabs/devtools'
import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createGetHreByEid,
    createGnosisSignerFactory,
    createSignerFactory,
    getNetworkNameForEid,
} from '@layerzerolabs/devtools-evm-hardhat'

import {
    TASK_STG_OWNABLE_TRANSFER_OWNERSHIP,
    TASK_STG_WIRE_CIRCLE_TOKEN_SET_ADMIN,
    TASK_STG_WIRE_MESSAGING_DELEGATE,
} from '../../devtools/tasks/constants'

import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

const getHre = createGetHreByEid()

type OneSigContextConfig = {
    tx: OmniTransaction
    networkName: string
    oneSigConfiguration: OneSigConfig
}

type OneSigConfig = {
    signers: string[]
    threshold: number
    totalSigners: number
}

interface PendingTX {
    contractName: string
    contractAddress: string
    currentMultisigOwner: string
    newOneSigOwner: string
    oneSigContextConfig: OneSigContextConfig
    isValid: boolean
}

let ONE_SIG_THRESHOLD = 3
const ONE_SIG_TOTAL_SIGNERS = 6
const ONE_SIG_SIGNERS = [
    '0x79e2b9C1F6C9ed1375C93AaF139e6C4537f48523',
    '0xf02CC4dc84aC59Bd6089BAddcEB9d4Ef3AEFb0f0',
    '0x8A403992b0d9CA20f009063C7bE6F20814Cb8AEB',
    '0x1D7C6783328C145393e84fb47a7f7C548f5Ee28d',
    '0x565cFd7224bbc2a81a6e2a1464892ecB27efB070',
    '0x2E1078e128e8AA6A70eC8d1B17A79Fc4B457d437',
]

const MAINNET_CONFIGS = [
    './devtools/config/mainnet/01/asset.eth.config.ts',
    './devtools/config/mainnet/01/asset.eurc.config.ts',
    './devtools/config/mainnet/01/asset.meth.config.ts',
    './devtools/config/mainnet/01/asset.metis.config.ts',
    './devtools/config/mainnet/01/asset.usdc.config.ts',
    './devtools/config/mainnet/01/asset.usdt.config.ts',

    './devtools/config/mainnet/01/feelib-v1.eth.config.ts',
    './devtools/config/mainnet/01/feelib-v1.eurc.config.ts',
    './devtools/config/mainnet/01/feelib-v1.meth.config.ts',
    './devtools/config/mainnet/01/feelib-v1.metis.config.ts',
    './devtools/config/mainnet/01/feelib-v1.usdc.config.ts',
    './devtools/config/mainnet/01/feelib-v1.usdt.config.ts',

    './devtools/config/mainnet/01/oft-token.config.ts',
    './devtools/config/mainnet/01/oft-wrapper.config.ts',

    './devtools/config/mainnet/01/rewarder.config.ts',
    './devtools/config/mainnet/01/staking.config.ts',
    './devtools/config/mainnet/01/treasurer.config.ts',

    './devtools/config/mainnet/01/token-messaging.config.ts',
    './devtools/config/mainnet/01/credit-messaging.config.ts',

    './devtools/config/mainnet/01/eurc-token.config.ts',
    './devtools/config/mainnet/01/usdc-token.config.ts',
    './devtools/config/mainnet/01/usdt-token.config.ts',
]

const TESTNET_CONFIGS = [
    './devtools/config/testnet/asset.eth.config.ts',
    './devtools/config/testnet/asset.eurc.config.ts',
    './devtools/config/testnet/asset.usdc.config.ts',
]

// networkName::oneSigAddress -> oneSigConfiguration
const cachedOneSigs: Record<string, OneSigConfig> = {}

// endpointId -> networkName
const cacheNetworkEid: Record<string, string> = {}

// networkName -> (lowercasedAddress -> contractName)
const deploymentsAddressIndex: Record<string, Record<string, string>> = {}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2)
    let stage = args.find((arg) => arg === 'testnet' || arg === 'mainnet')
    const safe = args.includes('--safe')
    const dryRun = args.includes('--dry-run')
    const usdcAdmin = args.includes('--usdc-admin')

    if (!stage) {
        stage = 'mainnet'
    }

    return { stage, safe, dryRun, usdcAdmin }
}

const { stage, safe, dryRun, usdcAdmin } = parseArgs()

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        // process.exit(1)
    })

async function main(): Promise<void> {
    ONE_SIG_THRESHOLD = stage === 'mainnet' ? 3 : 1

    console.log(`Running migration for ${stage} stage, safe mode: ${safe}`)

    const oappConfigs = stage === 'mainnet' ? MAINNET_CONFIGS : TESTNET_CONFIGS

    // 1. get all pending transactions from all configs
    const transactions = []

    // get the usdc admin config
    if (usdcAdmin) {
        const usdcAdminTXs = await getUSDCAdminPendingTXs()
        transactions.push(...usdcAdminTXs)
    } else {
        for (const config of oappConfigs) {
            console.log(`\nProcessing ${config} ...`)
            // only transfer delegate for credit messaging and token messaging
            const isMessaging = config.includes('messaging.config.ts')

            const response = await getPendingTXs(config, isMessaging)
            transactions.push(...response)
        }
    }
    // 2. Process the pending transactions to get the one sig configuration needed
    console.log('Processing pending transactions: ', transactions.length)
    const processedTXs = await processPendingTXs(transactions)

    // 3. Validate the one sig configuration
    console.log('Validating one sig configuration: ', processedTXs.length)
    const { pendingTXs, errors } = await validateTXs(processedTXs)

    // 4. Export the output to file
    const outputPath = join(__dirname, 'migration-output.txt')
    exportOutput(pendingTXs, errors, outputPath)

    // 5. propose all transactions at once
    if (dryRun) {
        console.log('Dry run mode, skipping proposal')
    } else {
        // do not propose if there are errors in the one sig configuration
        if (errors.length > 0) {
            console.log('❌ Errors found, skipping proposal')
            return
        }
        await proposeTransactions(transactions)
    }
}

async function getPendingTXs(oappConfig: string, isMessaging = false): Promise<OmniTransaction[]> {
    const args = {
        oappConfig,
        signer: { type: 'named', name: 'deployer' },
        dryRun: true,
        safe,
    }
    // Get all contracts that needs to transfer ownership to oneSig
    const [, , pendingOwnershipTXs]: SignAndSendResult = await run(TASK_STG_OWNABLE_TRANSFER_OWNERSHIP, args)

    // only transfer delegate for credit messaging and token messaging
    if (isMessaging) {
        // Get all contracts that needs to transfer delegate to oneSig
        const [, , pendingDelegateTXs]: SignAndSendResult = await run(TASK_STG_WIRE_MESSAGING_DELEGATE, args)

        // return both ownership and delegate transactions, delegate first and then ownership since only owner can set delegate to set it before transferring ownership
        return [...pendingDelegateTXs, ...pendingOwnershipTXs]
    }

    // if is not a messaging config, return only the ownership transactions
    return [...pendingOwnershipTXs]
}

async function getUSDCAdminPendingTXs(): Promise<OmniTransaction[]> {
    const args = {
        oappConfig: './devtools/config/mainnet/01/usdc-admin.config.ts',
        signer: { type: 'named', name: 'deployer' },
        dryRun: true,
        safe,
    }
    // Get all admin trasnfers to oneSig
    const [, , txs]: SignAndSendResult = await run(TASK_STG_WIRE_CIRCLE_TOKEN_SET_ADMIN, args)
    return txs
}

async function processPendingTXs(
    transactions: OmniTransaction[]
): Promise<{ oneSigContextConfig: OneSigContextConfig; error: string | undefined }[]> {
    const txsConfigs: { oneSigContextConfig: OneSigContextConfig; error: string | undefined }[] = []
    for (const tx of transactions) {
        console.log(`\nProcessing ${tx.point.address} ...`)
        const networkName = _getNetworkNameByEid(tx.point.eid)
        console.log(` on ${networkName} ...`)
        txsConfigs.push(await _getOneSigConfiguration(tx, networkName)) // oneSigContextConfig
    }

    return txsConfigs
}

async function validateTXs(
    processedTXs: { oneSigContextConfig: OneSigContextConfig; error: string | undefined }[]
): Promise<{ pendingTXs: PendingTX[]; errors: string[] }> {
    const pendingTXs: PendingTX[] = []
    const errors: string[] = []
    for (const processedtx of processedTXs) {
        const contractAddress = processedtx.oneSigContextConfig.tx.point.address
        const networkName = processedtx.oneSigContextConfig.networkName
        const oneSigContextConfig = processedtx.oneSigContextConfig
        const tx = oneSigContextConfig.tx
        const processedError = processedtx.error

        // validate oneSig configuration
        const checkResult = await _checkOneSigConfiguration(oneSigContextConfig)

        // get the contract name
        const contractName = await _getContractNameByAddress(tx, networkName, contractAddress)

        // push all pending txs
        pendingTXs.push({
            // networkName: networkName,
            contractName: contractName,
            contractAddress: tx.point.address,
            currentMultisigOwner: await _getCurrentMultisigOwner(tx),
            newOneSigOwner: _getNewAddressFromFirstParam(tx.data),
            oneSigContextConfig: oneSigContextConfig,
            isValid: processedError === undefined && checkResult === undefined,
        })

        if (processedError !== undefined) {
            errors.push(processedError)
        }
        if (checkResult !== undefined) {
            errors.push(checkResult)
        }
    }

    return { pendingTXs, errors }
}

function exportOutput(pendingTXs: PendingTX[], errors: string[], outputPath = './migration-output.txt') {
    // generate the table content
    const tableContent = generateTableContent(pendingTXs)

    // generate errors content if any while getting the one sig configuration
    const errorsContent = generateErrorsContent(errors)

    // combine all content
    const fullContent = `${tableContent}\n\n\n\n${errorsContent}`

    // write to file
    writeFileSync(outputPath, fullContent, 'utf8')
    console.log(`✅ Output exported to: ${outputPath}`)
}

async function proposeTransactions(transactions: OmniTransaction[]) {
    // Create signer factory
    const createSigner = safe
        ? createGnosisSignerFactory({ type: 'named', name: 'deployer' })
        : createSignerFactory({ type: 'named', name: 'deployer' })

    // Sign and send without prompts
    const ci = false

    // fill env vars to submit in batches
    process.env.LZ_ENABLE_EXPERIMENTAL_BATCHED_SEND = 'true'
    // process.env.LZ_BATCH_SIZE = '10' // default value is 20

    const signAndSendResult: SignAndSendResult = await run(SUBTASK_LZ_SIGN_AND_SEND, {
        transactions,
        ci,
        createSigner,
    } satisfies SignAndSendTaskArgs)

    // Mark the process as unsuccessful if there were any errors (only if it has not yet been marked as such)
    const [, failed] = signAndSendResult
    if (failed.length !== 0) {
        process.exitCode = process.exitCode || 1
    }
}

// helpers

/**
 * Get the one sig configuration for a given contract address in a chain
 * It returns:
 * - the one sig configuration context
 *    - the network name
 *    - the signers list
 *    - the threshold
 *    - the total signers
 * - the error if any
 *
 * If the one sig configuration is already cached, it will return the cached one
 */
async function _getOneSigConfiguration(
    tx: OmniTransaction,
    networkName: string
): Promise<{
    oneSigContextConfig: OneSigContextConfig
    error: string | undefined
}> {
    const newOneSigAddress = _getNewAddressFromFirstParam(tx.data)

    // check if the one sig configuration is already cached
    const key = _getKey(networkName, newOneSigAddress)
    if (cachedOneSigs[key]) {
        console.log(`One sig configuration already cached for ${networkName}, ${newOneSigAddress}`)
        // already exists
        return {
            oneSigContextConfig: {
                networkName,
                tx,
                oneSigConfiguration: cachedOneSigs[key],
            },
            error: undefined,
        }
    }
    console.log(`One sig configuration not cached for ${networkName}, ${newOneSigAddress}`)

    // Read-only call to fetch new one sig configuration
    const hre = (await getHre(tx.point.eid)) as any
    const abi = [
        'function getSigners() view returns (address[])',
        'function threshold() view returns (uint256)',
        'function totalSigners() view returns (uint256)',
    ]
    const contract = new hre.ethers.Contract(newOneSigAddress, abi, hre.ethers.provider)
    let signers: string[] = []
    let threshold = 0
    let totalSigners = 0

    const errors: string[] = []
    try {
        signers = await contract.getSigners()
    } catch (error) {
        errors.push(`getSigners: ${error} \n`)
    }
    try {
        threshold = await contract.threshold()
    } catch (error) {
        errors.push(`threshold: ${error} \n`)
    }
    try {
        totalSigners = await contract.totalSigners()
    } catch (error) {
        errors.push(`totalSigners: ${error} \n`)
    }

    // batch errors if any
    const error =
        errors.length > 0
            ? `Error getting one sig configuration for ${networkName},  ${newOneSigAddress}: ${errors.join('\n')}`
            : undefined

    const oneSigConfiguration: OneSigConfig = { signers, threshold, totalSigners }
    const oneSigContextConfig: OneSigContextConfig = { networkName, tx, oneSigConfiguration }

    // cache the one sig configuration
    cachedOneSigs[key] = oneSigConfiguration

    return { oneSigContextConfig, error }
}

function _getNetworkNameByEid(eid: number): string {
    if (eid in cacheNetworkEid) {
        return cacheNetworkEid[eid]
    }

    const networkName = getNetworkNameForEid(eid)
    cacheNetworkEid[eid] = networkName
    return networkName
}

/**
 * Check the one sig configuration is correct
 * It checks:
 * - the total signers is correct (6)
 * - the threshold is correct (3 in mainnet, 1 in testnet)
 * - the signers list length is correct (6)
 * - the signers are in the list (the list is the same as the ONE_SIG_SIGNERS list)
 */
async function _checkOneSigConfiguration(oneSigContextConfig: OneSigContextConfig): Promise<string | undefined> {
    const { oneSigConfiguration } = oneSigContextConfig
    const errors: string[] = []
    // check the total signers is correct
    if (oneSigConfiguration.totalSigners != ONE_SIG_TOTAL_SIGNERS)
        errors.push(
            `Total signers is incorrect, for chain ${oneSigContextConfig.networkName}, expected ${ONE_SIG_TOTAL_SIGNERS}, got ${oneSigConfiguration.totalSigners}`
        )

    // check the threshold is correct
    if (oneSigConfiguration.threshold != ONE_SIG_THRESHOLD)
        errors.push(
            `Threshold is incorrect, for chain ${oneSigContextConfig.networkName}, expected ${ONE_SIG_THRESHOLD}, got ${oneSigConfiguration.threshold}`
        )

    // check signers list length is correct
    if (oneSigConfiguration.signers.length != ONE_SIG_SIGNERS.length)
        errors.push(
            `Signers list is incorrect, for chain ${oneSigContextConfig.networkName}, expected ${ONE_SIG_SIGNERS.length}, got ${oneSigConfiguration.signers.length}`
        )
    else {
        // check if all signers are in the list
        for (const signer of ONE_SIG_SIGNERS) {
            if (!oneSigConfiguration.signers.includes(signer)) {
                errors.push(`Signer ${signer} is not in the list, for chain ${oneSigContextConfig.networkName}`)
            }
        }
    }
    const error = errors.length > 0 ? `Error checking one sig configuration: ${errors.join('\n')}` : undefined

    return error
}

/**
 * Parses calldata and extracts the first argument (address).
 * Assumes the calldata corresponds to a function that takes
 * an address as the first argument.
 * Supports both `transferOwnership(address)` and `setDelegate(address)`.
 */
function _getNewAddressFromFirstParam(data: string): string {
    if (!data || data.length < 10) return '0x'

    // Define a minimal ABI for decoding
    const abi = [
        'function transferOwnership(address)',
        'function setDelegate(address)',
        'function changeAdmin(address)',
    ]
    const iface = new ethers.utils.Interface(abi)

    try {
        const parsed = iface.parseTransaction({ data })
        const [firstParam] = parsed.args
        return firstParam
    } catch (e) {
        console.warn('Could not decode calldata:', e)
        return '0x'
    }
}

/**
 * Get the current multisig owner for a given contract address in a chain
 */
async function _getCurrentMultisigOwner(tx: OmniTransaction): Promise<string> {
    const hre = (await getHre(tx.point.eid)) as any

    const contractAddress = tx.point.address

    const abi = ['function owner() view returns (address)']
    const contract = new hre.ethers.Contract(contractAddress, abi, hre.ethers.provider)
    return await contract.owner()
}

function generateErrorsContent(errors: string[]): string {
    if (errors.length === 0) {
        return '✅ No errors found.'
    }

    let content = `❌ ${errors.length} Errors found:\n`
    content += '-----------------------------\n'

    errors.forEach((error, index) => {
        content += `${index + 1}. ${error}\n`
    })

    content += '-----------------------------\n'
    return content
}

function generateTableContent(pendingTXs: PendingTX[]): string {
    if (pendingTXs.length === 0) {
        return 'No pending transactions found.\n'
    }

    // Sort by networkName to group by chain
    const sortedTXs = [...pendingTXs].sort((a, b) =>
        a.oneSigContextConfig.networkName.localeCompare(b.oneSigContextConfig.networkName)
    )

    // Define headers
    const headers = [
        'index',
        'isValid',
        'networkName',
        'contractName',
        'contractAddress',
        'currentMultisigOwner',
        'newOneSigOwner',
        'oneSigThreshold',
        'oneSigTotal',
        'oneSigSigners',
        'txDescription',
        'txData',
    ]

    // Map each tx to a row object
    const rows = sortedTXs.map((tx, idx) => ({
        index: String(idx + 1),
        isValid: tx.isValid ? '✅' : '❌',
        networkName: tx.oneSigContextConfig.networkName,
        contractName: tx.contractName,
        contractAddress: tx.contractAddress,
        currentMultisigOwner: tx.currentMultisigOwner,
        newOneSigOwner: tx.newOneSigOwner,
        oneSigThreshold: tx.oneSigContextConfig.oneSigConfiguration.threshold.toString(),
        oneSigTotal: tx.oneSigContextConfig.oneSigConfiguration.totalSigners.toString(),
        oneSigSigners: tx.oneSigContextConfig.oneSigConfiguration.signers.join(','),
        txDescription: tx.oneSigContextConfig.tx.description ?? 'No description',
        txData: tx.oneSigContextConfig.tx.data,
    }))

    // Compute max width per column
    const colWidths = headers.map((header) =>
        Math.max(header.length, ...rows.map((row) => row[header as keyof typeof row]?.length ?? 0))
    )

    // Format a row into a padded string
    const formatRow = (row: Record<string, string>) =>
        headers.map((header, i) => (row[header] ?? '').padEnd(colWidths[i], ' ')).join('  ') // spacing between columns

    // Generate the full table
    let content = `Total Rows: ${rows.length}\n\n`
    content += formatRow(Object.fromEntries(headers.map((h) => [h, h]))) + '\n'
    content += colWidths.map((w) => '-'.repeat(w)).join('  ') + '\n'
    for (const row of rows) {
        content += formatRow(row) + '\n'
    }

    return content
}

/**
 * Get the contract from the deployments folder for a given address in a chain
 * if the address is not found, return 'External deployment', in those cases the contract name should be either "USDC", "EURC" or "USDT"
 */
async function _getContractNameByAddress(tx: OmniTransaction, networkName: string, address: string): Promise<string> {
    const normalizedTarget = address.toLowerCase()

    // Build the index once per network on first use
    _buildDeploymentsIndexForNetwork(networkName)

    const name = deploymentsAddressIndex[networkName]?.[normalizedTarget]
    if (name) return name

    return 'USDC'
}

function _buildDeploymentsIndexForNetwork(networkName: string): void {
    if (deploymentsAddressIndex[networkName]) return

    try {
        const deploymentsDir = join(__dirname, '..', 'deployments', networkName)
        if (!existsSync(deploymentsDir)) {
            // mark as initialized to avoid repeated filesystem checks
            deploymentsAddressIndex[networkName] = {}
            return
        }

        const files = readdirSync(deploymentsDir).filter((f) => f.endsWith('.json'))
        const index: Record<string, string> = {}

        for (const file of files) {
            try {
                const filePath = join(deploymentsDir, file)
                const json = JSON.parse(readFileSync(filePath, 'utf8')) as { address?: string }
                const deployedAddress = json.address?.toLowerCase()
                if (deployedAddress) {
                    index[deployedAddress] = file.replace(/\.json$/, '')
                }
            } catch {
                // Ignore parse errors and continue building the index
            }
        }

        deploymentsAddressIndex[networkName] = index
    } catch {
        // If anything goes wrong, ensure an empty index is set to avoid repeated attempts
        deploymentsAddressIndex[networkName] = {}
    }
}

function _getKey(networkName: string, oneSigAddress: string): string {
    return `${networkName.toLowerCase()}::${oneSigAddress.toLowerCase()}`
}
