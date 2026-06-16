import fs from 'fs'
import path from 'path'

import * as yaml from 'js-yaml'

import { Stage } from '@layerzerolabs/lz-definitions'

import { requireStage } from '../../config/utils/utils.config'

type DeprecatedEidEntry = {
    eid: number
    chain: string
    reason: string
}

type DisconnectedCheckYamlConfig = {
    deprecated_eids: DeprecatedEidEntry[]
    active_chains?: string[] | string
}

export type ResolvedDeprecatedEid = {
    eid: number
    chain: string
    reason: string
}

export type ResolvedDisconnectedCheckConfig = {
    deprecatedEids: ResolvedDeprecatedEid[]
    activeChains: string[] | undefined
    configPath: string
}

const CONFIG_FILE_NAME = 'messaging.disconnected-check.yml'
const CONFIG_PATH_BY_STAGE: Record<Stage, string> = {
    [Stage.MAINNET]: path.join(
        __dirname,
        '..',
        '..',
        'config',
        'mainnet',
        '01',
        'chainsConfig',
        'unwire',
        CONFIG_FILE_NAME
    ),
    [Stage.TESTNET]: path.join(__dirname, '..', '..', 'config', 'testnet', 'chainsConfig', 'unwire', CONFIG_FILE_NAME),
    [Stage.SANDBOX]: path.join(__dirname, '..', '..', 'config', 'sandbox', 'chainsConfig', 'unwire', CONFIG_FILE_NAME),
}

export function loadDisconnectedCheckConfig(): ResolvedDisconnectedCheckConfig {
    const configPath = CONFIG_PATH_BY_STAGE[requireStage()]
    if (!fs.existsSync(configPath)) {
        throw new Error(`Disconnected check config not found at ${configPath}`)
    }

    const fileContents = fs.readFileSync(configPath, 'utf8')
    const rawConfig = yaml.load(fileContents) as Partial<DisconnectedCheckYamlConfig> | undefined

    if (!rawConfig || typeof rawConfig !== 'object') {
        throw new Error(`Invalid disconnected check config at ${configPath}`)
    }

    if (rawConfig.deprecated_eids == null) {
        throw new Error(`Disconnected check config missing 'deprecated_eids' at ${configPath}`)
    }

    const rawList = Array.isArray(rawConfig.deprecated_eids) ? rawConfig.deprecated_eids : [rawConfig.deprecated_eids]

    const deprecatedEids = rawList.map((entry, i) => {
        if (typeof entry !== 'object' || entry == null) {
            throw new Error(`deprecated_eids[${i}] must be an object with eid, chain, and reason at ${configPath}`)
        }
        if (typeof entry.eid !== 'number' || !Number.isInteger(entry.eid)) {
            throw new Error(`deprecated_eids[${i}].eid must be an integer at ${configPath}`)
        }
        if (typeof entry.chain !== 'string' || entry.chain.trim() === '') {
            throw new Error(`deprecated_eids[${i}].chain must be a non-empty string at ${configPath}`)
        }
        if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
            throw new Error(`deprecated_eids[${i}].reason must be a non-empty string at ${configPath}`)
        }
        return { eid: entry.eid, chain: entry.chain.trim(), reason: entry.reason.trim() }
    })

    if (!deprecatedEids.length) {
        throw new Error(`Disconnected check config 'deprecated_eids' must not be empty at ${configPath}`)
    }

    let activeChains: string[] | undefined
    if (rawConfig.active_chains != null) {
        const rawList = Array.isArray(rawConfig.active_chains) ? rawConfig.active_chains : [rawConfig.active_chains]
        for (const entry of rawList) {
            if (typeof entry !== 'string' || entry.trim() === '') {
                throw new Error(
                    `Invalid entry "${entry}" in active_chains at ${configPath} — all entries must be non-empty strings`
                )
            }
        }
        const normalized = rawList.map((s) => s.trim())
        if (normalized.length === 0) {
            throw new Error(`Disconnected check config 'active_chains' must not be empty when present at ${configPath}`)
        }
        activeChains = normalized
    }

    return { deprecatedEids, activeChains, configPath }
}
