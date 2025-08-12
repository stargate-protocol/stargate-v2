import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import { run } from 'hardhat'

import { type OmniTransaction, type SignAndSendResult } from '@layerzerolabs/devtools'
import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createGetHreByEid,
    createGnosisSignerFactory,
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

async function main(): Promise<void> {
    const oappConfigs = [
        './devtools/config/mainnet/01/oft-wrapper.config.ts',
        './devtools/config/mainnet/01/token-messaging.config.ts',
        './devtools/config/mainnet/01/usdc-token.config.ts',
        './devtools/config/mainnet/01/asset.eth.config.ts',
        // Add additional configs to this list as needed.
    ]

    for (const config of oappConfigs) {
        console.log(`Processing ${config} ...`)
        await getPendingTXs(config)
    }
}

async function getPendingTXs(oappConfig: string) {
    const args = {
        oappConfig,
        signer: 'deployer',
        dryRun: true,
        logLevel: 'error',
    }
    // 1- Get all contracts that needs to transfer ownership to oneSig
    const result: SignAndSendResult = await run('lz:ownable:transfer-ownership', args)
    const transactions: OmniTransaction[] = result[2] // pending transactions

    // 2- Print the a table with one sig address config
    console.log('===============================')
    console.log('       Preparing the Table     ')
    console.log('===============================')

    const pendingTXs: PendingTX[] = []
    const errors: string[] = []
    for (const tx of transactions) {
        const networkName = getNetworkNameForEid(tx.point.eid)
        const oneSigConfiguration = await getOneSigConfiguration(tx, networkName)
        // get the contract name
        const contractName = await _getContractNameForAddress(networkName, tx.point.address)
        pendingTXs.push({
            networkName: networkName,
            contractName: contractName,
            contractAddress: tx.point.address,
            currentMultisigOwner: await _getCurrentMultisigOwner(tx),
            newOneSigOwner: _getNewAddress(tx.data),
            oneSigConfiguration: oneSigConfiguration,
        })
        if (oneSigConfiguration.error !== undefined) {
            errors.push(oneSigConfiguration.error)
        }
    }

    printTable(pendingTXs)

    // 3- Print errors if any while getting the one sig configuration
    printErrors(errors)

    // todo should add checks for ensuring all current multisig owners are one sig owners, to check the threshold and/or total signers?

    // 4- Propose the transactions to the multisig
    // Create signer factory
    // todo check if works (code copied from the transfer-ownership task)
    const createSigner = createGnosisSignerFactory({ type: 'named', name: 'deployer' })

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

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        // process.exit(1)
    })

async function getOneSigConfiguration(
    tx: OmniTransaction,
    networkName: string
): Promise<{
    signers: string[]
    threshold: number
    totalSigners: number
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

    return { signers, threshold, totalSigners, error }
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
        oneSigThreshold: x.oneSigConfiguration.threshold,
        oneSigTotal: x.oneSigConfiguration.totalSigners,
        oneSigSigners: x.oneSigConfiguration.signers.join(','),
    }))
    console.table(rows)
}

async function _getContractNameForAddress(networkName: string, address: string): Promise<string> {
    try {
        const deploymentsDir = join(__dirname, '..', 'deployments', networkName)
        if (!existsSync(deploymentsDir)) return ''

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
    return ''
}
