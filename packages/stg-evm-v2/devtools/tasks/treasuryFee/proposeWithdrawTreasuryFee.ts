import { readFileSync } from 'fs'
import { join } from 'path'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { createTreasurerFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'
import { load as loadYaml } from 'js-yaml'

import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createConnectedContractFactory,
    createGnosisSignerFactory,
    getEidForNetworkName,
    getHreByNetworkName,
} from '@layerzerolabs/devtools-evm-hardhat'

import { getStargateDeployName } from '../../../ops/util'
import { getAssetType } from '../../../ts-src/utils/util'
import { createOneSigSignerFactory } from '../../onesig'
import { TASK_STG_PROPOSE_WITHDRAW_TREASURY_FEE } from '../constants'

import type { OmniTransaction, SignAndSendResult } from '@layerzerolabs/devtools'
import type { SignerDefinition } from '@layerzerolabs/devtools-evm'
import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

const DEFAULT_YML = join(__dirname, 'withdrawTreasuryFee.yml')
const TREASURER_DEPLOYMENT = 'Treasurer'
const DEPLOYER_SIGNER: SignerDefinition = { type: 'named', name: 'deployer' }
const TOKEN_NAME_VALUES = new Set<string>(Object.values(TokenName))

// ——— YAML types ———

interface TreasuryActionYml {
    chain: string
    asset?: string
    stargate?: string
    stargateDeployment?: string
    amount: string | number
    to: string
    description?: string
}

interface TreasuryFeeConfigYml {
    actions: TreasuryActionYml[]
}

// ——— Helpers ———

function loadConfig(configPath: string): TreasuryFeeConfigYml {
    const raw = readFileSync(configPath, 'utf8')
    const parsed = loadYaml(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as TreasuryFeeConfigYml).actions)) {
        throw new Error(`Invalid YAML: expected top-level "actions" array (file: ${configPath})`)
    }
    return parsed as TreasuryFeeConfigYml
}

function parseBigInt(value: string | number, label: string): bigint {
    const s = String(value).trim()
    if (!/^\d+$/.test(s)) {
        throw new Error(`${label}: amount must be a non-negative integer string, got ${JSON.stringify(value)}`)
    }
    return BigInt(s)
}

function parseTokenName(asset: string, label: string): TokenName {
    const s = asset.trim()
    if (!TOKEN_NAME_VALUES.has(s)) {
        throw new Error(`${label}: unknown asset "${asset}". Expected one of: ${[...TOKEN_NAME_VALUES].join(', ')}`)
    }
    return s as TokenName
}

async function resolveStargate(
    hre: Awaited<ReturnType<typeof getHreByNetworkName>>,
    eid: ReturnType<typeof getEidForNetworkName>,
    action: TreasuryActionYml,
    label: string
): Promise<string> {
    const specifiers = [action.asset, action.stargate, action.stargateDeployment].filter(Boolean)
    if (specifiers.length !== 1) {
        throw new Error(`${label}: set exactly one of asset, stargate, or stargateDeployment`)
    }
    if (action.asset) {
        const tokenName = parseTokenName(action.asset, label)
        const deployName = getStargateDeployName(tokenName, getAssetType(eid, tokenName))
        return (await hre.deployments.get(deployName)).address
    }
    if (action.stargate) {
        return ethers.utils.getAddress(action.stargate.trim())
    }
    return (await hre.deployments.get(action.stargateDeployment!)).address
}

// ——— Transaction builder ———

async function buildTransactions(config: TreasuryFeeConfigYml): Promise<OmniTransaction[]> {
    const treasurerFactory = createTreasurerFactory(createConnectedContractFactory())
    const out: OmniTransaction[] = []
    for (let i = 0; i < config.actions.length; i++) {
        const action = config.actions[i]
        const label = `actions[${i}] (chain=${action.chain})`
        if (!action.chain) throw new Error(`${label}: chain is required`)
        if (action.amount === undefined) throw new Error(`${label}: amount is required`)
        if (!action.to?.trim()) throw new Error(`${label}: to is required`)

        const hre = await getHreByNetworkName(action.chain)
        const eid = getEidForNetworkName(action.chain, hre)
        const treasurer = await hre.deployments.get(TREASURER_DEPLOYMENT)
        const sdk = await treasurerFactory({ eid, address: treasurer.address })
        const stargate = await resolveStargate(hre, eid, action, label)
        const amount = parseBigInt(action.amount, label)
        const to = ethers.utils.getAddress(action.to.trim())

        const withdrawTx = await sdk.withdrawTreasuryFee(stargate, amount)
        out.push({ ...withdrawTx, description: action.description ?? withdrawTx.description })

        const transferTx = await sdk.transferToken(stargate, to, amount)
        out.push({ ...transferTx, description: action.description ?? transferTx.description })
    }
    return out
}

// ——— Hardhat task ———

interface TaskArgs {
    safe: boolean
    onesig: boolean
}

task(
    TASK_STG_PROPOSE_WITHDRAW_TREASURY_FEE,
    'Propose Treasurer ops from YAML — devtools/tasks/treasuryFee/withdrawTreasuryFee.yml'
)
    .addFlag('safe', 'Sign with Gnosis Safe')
    .addFlag('onesig', 'Sign with One Sig')
    .setAction(async (args: TaskArgs, hre) => {
        if (args.safe === args.onesig) {
            throw new Error('Specify exactly one of --safe or --onesig')
        }

        const cfg = loadConfig(DEFAULT_YML)
        if (cfg.actions.length === 0) {
            throw new Error(`No actions in ${DEFAULT_YML}; add at least one action.`)
        }

        const transactions = await buildTransactions(cfg)

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
