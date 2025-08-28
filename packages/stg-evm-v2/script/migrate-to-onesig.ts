import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import { run } from 'hardhat'

import { type OmniTransaction, type SignAndSendResult } from '@layerzerolabs/devtools'
import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createGetHreByEid,
    createGnosisSignerFactory,
    createSignerFactory,
    getNetworkNameForEid,
} from '@layerzerolabs/devtools-evm-hardhat'

import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

const getHre = createGetHreByEid()

interface PendingTX {
    networkName: string
    contractName: string
    contractAddress: string
    currentMultisigOwner: string
    newOneSigOwner: string
    oneSigConfiguration: {
        signers: string[]
        threshold: number
        totalSigners: number
    }
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
    // './devtools/config/mainnet/01/asset.meth.config.ts',
    // './devtools/config/mainnet/01/asset.metis.config.ts',
    // './devtools/config/mainnet/01/asset.usdc.config.ts',
    // './devtools/config/mainnet/01/asset.usdt.config.ts',

    // './devtools/config/mainnet/01/feelib-v1.eth.config.ts',
    // './devtools/config/mainnet/01/feelib-v1.eurc.config.ts',
    // './devtools/config/mainnet/01/feelib-v1.meth.config.ts',
    // './devtools/config/mainnet/01/feelib-v1.metis.config.ts',
    // './devtools/config/mainnet/01/feelib-v1.usdc.config.ts',
    // './devtools/config/mainnet/01/feelib-v1.usdt.config.ts',

    // './devtools/config/mainnet/01/oft-token.config.ts',
    // './devtools/config/mainnet/01/oft-wrapper.config.ts',

    // './devtools/config/mainnet/01/rewarder.config.ts',
    // './devtools/config/mainnet/01/staking.config.ts',
    // './devtools/config/mainnet/01/treasurer.config.ts',

    // './devtools/config/mainnet/01/credit-messaging.config.ts',
    // './devtools/config/mainnet/01/token-messaging.config.ts',

    // './devtools/config/mainnet/01/eurc-token.config.ts',
    // './devtools/config/mainnet/01/usdc-token.config.ts',
    // './devtools/config/mainnet/01/usdt-token.config.ts',
]

const TESTNET_CONFIGS = [
    './devtools/config/testnet/asset.eth.config.ts',
    './devtools/config/testnet/asset.eurc.config.ts',
    './devtools/config/testnet/asset.usdc.config.ts',
    './devtools/config/testnet/asset.usdt.config.ts',
    './devtools/config/testnet/credit-messaging.config.ts',
    './devtools/config/testnet/eurc-token.config.ts',
    './devtools/config/testnet/feelib-v1.eth.config.ts',
    './devtools/config/testnet/feelib-v1.eurc.config.ts',
    './devtools/config/testnet/feelib-v1.usdc.config.ts',
    './devtools/config/testnet/feelib-v1.usdt.config.ts',
    './devtools/config/testnet/token-messaging.config.ts',
    './devtools/config/testnet/treasurer.config.ts',
    './devtools/config/testnet/staking.config.ts',
    './devtools/config/testnet/rewarder.config.ts',
    './devtools/config/testnet/usdt-token.config.ts',
    './devtools/config/testnet/usdc-token.config.ts',
]

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2)
    let stage = args.find((arg) => arg === 'testnet' || arg === 'mainnet')
    const safe = args.includes('--safe')
    const dryRun = args.includes('--dry-run')

    if (!stage) {
        stage = 'mainnet'
    }

    return { stage, safe, dryRun }
}

const { stage, safe, dryRun } = parseArgs()

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
    for (const config of oappConfigs) {
        console.log(`Processing ${config} ...`)
        const response = await getPendingTXs(config)
        transactions.push(...response)
    }

    // 2. Print the table with each tx details and errors if any
    const errors = await processPendingTXs(transactions)

    // do not propose if there are errors in the one sig configuration
    if (errors.length > 0) {
        console.log('❌ Errors found, skipping proposal')
        return
    }

    // 3. propose all transactions at once
    if (dryRun) {
        console.log('Dry run mode, skipping proposal')
    } else {
        await proposeTransactions(transactions)
    }
}

async function getPendingTXs(oappConfig: string): Promise<OmniTransaction[]> {
    const args = {
        oappConfig,
        signer: 'deployer',
        dryRun: true,
        logLevel: 'error',
    }
    // Get all contracts that needs to transfer ownership to oneSig
    const result: SignAndSendResult = await run('lz:ownable:transfer-ownership', args)
    const [, , pending] = result
    return pending // pending transactions
}

async function processPendingTXs(transactions: OmniTransaction[]): Promise<string[]> {
    const pendingTXs: PendingTX[] = []
    const errors: string[] = []
    for (const tx of transactions) {
        const networkName = getNetworkNameForEid(tx.point.eid)
        const configResult = await _getOneSigConfiguration(tx, networkName)

        // check oneSig configuration
        const checkResult = await _checkOneSigConfiguration(configResult.oneSigContextConfig)

        // get the contract name
        const contractName = await _getContractNameForAddress(networkName, tx.point.address)
        pendingTXs.push({
            networkName: networkName,
            contractName: contractName,
            contractAddress: tx.point.address,
            currentMultisigOwner: await _getCurrentMultisigOwner(tx),
            newOneSigOwner: _getNewAddress(tx.data),
            oneSigConfiguration: configResult.oneSigContextConfig.oneSigConfiguration,
        })
        if (configResult.error !== undefined) {
            errors.push(configResult.error)
        }
        if (checkResult !== undefined) {
            errors.push(checkResult)
        }
    }

    // print the table with txs details
    printTable(pendingTXs)

    // print errors if any while getting the one sig configuration
    printErrors(errors)

    return errors
}

async function proposeTransactions(transactions: OmniTransaction[]) {
    // Create signer factory
    const createSigner = safe
        ? createGnosisSignerFactory({ type: 'named', name: 'deployer' })
        : createSignerFactory({ type: 'named', name: 'deployer' })

    // Sign and send without prompts
    const ci = false
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

type OneSigContextConfig = {
    networkName: string
    oneSigConfiguration: OneSigConfiguration
}

type OneSigConfiguration = {
    signers: string[]
    threshold: number
    totalSigners: number
}

// helpers
async function _getOneSigConfiguration(
    tx: OmniTransaction,
    networkName: string
): Promise<{
    oneSigContextConfig: OneSigContextConfig
    error: string | undefined
}> {
    const newAddress = _getNewAddress(tx.data)
    // Read-only call to fetch new one sig configuration
    const hre = (await getHre(tx.point.eid)) as any
    const abi = [
        'function getSigners() view returns (address[])',
        'function threshold() view returns (uint256)',
        'function totalSigners() view returns (uint256)',
    ]
    const contract = new hre.ethers.Contract(newAddress, abi, hre.ethers.provider)
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

    const error =
        errors.length > 0
            ? `Error getting one sig configuration for ${networkName},  ${newAddress}: ${errors.join('\n')}`
            : undefined

    const oneSigConfiguration: OneSigConfiguration = { signers, threshold, totalSigners }
    const oneSigContextConfig: OneSigContextConfig = { networkName, oneSigConfiguration }
    return { oneSigContextConfig, error }
}

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

function _getNewAddress(data: string): string {
    const hex = data.startsWith('0x') ? data.slice(2) : data
    if (hex.length < 72) return '0x'
    const functionArg0 = hex.slice(8, 72) // getting the first arg of the calldata
    return `0x${functionArg0.slice(-40)}` // last 20 bytes
}

async function _getCurrentMultisigOwner(tx: OmniTransaction): Promise<string> {
    const hre = (await getHre(tx.point.eid)) as any

    const contractAddress = tx.point.address

    const abi = ['function owner() view returns (address)']
    const contract = new hre.ethers.Contract(contractAddress, abi, hre.ethers.provider)
    return await contract.owner()
}

function printErrors(errors: string[]) {
    if (errors.length === 0) {
        console.log('✅ No errors found.')
        return
    }

    console.log(`❌ ${errors.length} Errors found:`)
    console.log('-----------------------------')

    errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
    })

    console.log('-----------------------------')
}

function printTable(pendingTXs: PendingTX[]) {
    const rows = pendingTXs.map((x) => ({
        networkName: x.networkName,
        contractName: x.contractName,
        contractAddress: x.contractAddress,
        currentMultisigOwner: x.currentMultisigOwner,
        newOneSigOwner: x.newOneSigOwner,
        oneSigThreshold: x.oneSigConfiguration.threshold.toString(),
        oneSigTotal: x.oneSigConfiguration.totalSigners.toString(),
        oneSigSigners: x.oneSigConfiguration.signers.join(','),
    }))
    console.table(rows)
}

async function _getContractNameForAddress(networkName: string, address: string): Promise<string> {
    try {
        const deploymentsDir = join(__dirname, '..', 'deployments', networkName)
        if (!existsSync(deploymentsDir)) return 'Err'

        const files = readdirSync(deploymentsDir).filter((f) => f.endsWith('.json'))
        const normalizedTarget = address.toLowerCase()

        for (const file of files) {
            try {
                const filePath = join(deploymentsDir, file)
                const json = JSON.parse(readFileSync(filePath, 'utf8')) as { address?: string }
                const deployedAddress = json.address?.toLowerCase()
                if (deployedAddress && deployedAddress === normalizedTarget) {
                    return file.replace(/\.json$/, '')
                }
            } catch {
                // Ignore parse errors and continue searching
            }
        }
    } catch {
        // fallthrough
    }
    return 'External deployment'
}
