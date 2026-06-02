import { readFileSync } from 'fs'
import { join } from 'path'

import { task } from 'hardhat/config'

import { SUBTASK_LZ_SIGN_AND_SEND, createGnosisSignerFactory } from '@layerzerolabs/devtools-evm-hardhat'

import { createOneSigSignerFactory } from '../../onesig'
import { TASK_STG_PROPOSE_TRANSACTIONS } from '../constants'

import type { OmniTransaction, SignAndSendResult } from '@layerzerolabs/devtools'
import type { SignerDefinition } from '@layerzerolabs/devtools-evm'
import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

const DEFAULT_TRANSACTIONS_PATH = join(__dirname, 'transactions.example.json')

const DEPLOYER_SIGNER: SignerDefinition = { type: 'named', name: 'deployer' }

interface RawOmniTransaction {
    point: {
        eid: number
        address: string
    }
    data: string
    value?: string
    description?: string
}

function loadTransactions(filePath: string): OmniTransaction[] {
    const raw = readFileSync(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
        throw new Error(`Invalid JSON: expected top-level array of transactions (file: ${filePath})`)
    }

    return parsed.map((entry: RawOmniTransaction, i: number) => {
        const label = `transactions[${i}]`

        if (typeof entry.point?.eid !== 'number') {
            throw new Error(`${label}: point.eid must be a number`)
        }
        if (typeof entry.point?.address !== 'string' || !entry.point.address) {
            throw new Error(`${label}: point.address must be a non-empty string`)
        }
        if (typeof entry.data !== 'string') {
            throw new Error(`${label}: data must be a hex string`)
        }

        const tx: OmniTransaction = {
            point: { eid: entry.point.eid, address: entry.point.address },
            data: entry.data,
        }

        if (entry.value !== undefined) {
            tx.value = BigInt(entry.value)
        }

        if (entry.description !== undefined) {
            tx.description = entry.description
        }

        return tx
    })
}

interface TaskArgs {
    transactionsPath: string
    safe: boolean
    onesig: boolean
}

task(TASK_STG_PROPOSE_TRANSACTIONS, 'Propose transactions from a JSON file via Safe or OneSig')
    .addOptionalParam('transactionsPath', 'Path to the transactions JSON file', DEFAULT_TRANSACTIONS_PATH)
    .addFlag('safe', 'Sign with Gnosis Safe')
    .addFlag('onesig', 'Sign with OneSig')
    .setAction(async (args: TaskArgs, hre) => {
        if (args.safe === args.onesig) {
            throw new Error('Specify exactly one of --safe or --onesig')
        }

        const transactions = loadTransactions(args.transactionsPath)

        if (transactions.length === 0) {
            throw new Error(`No transactions found in ${args.transactionsPath}`)
        }

        const createSigner: SignAndSendTaskArgs['createSigner'] = args.safe
            ? createGnosisSignerFactory(DEPLOYER_SIGNER)
            : createOneSigSignerFactory(DEPLOYER_SIGNER)

        const signAndSendResult: SignAndSendResult = await hre.run(SUBTASK_LZ_SIGN_AND_SEND, {
            transactions,
            ci: process.env.CI === 'true',
            createSigner,
        } satisfies SignAndSendTaskArgs)

        const [, failed] = signAndSendResult
        if (failed.length !== 0) {
            process.exitCode = process.exitCode || 1
        }

        return signAndSendResult
    })
