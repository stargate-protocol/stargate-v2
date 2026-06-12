import fs from 'fs'
import path from 'path'

import * as yaml from 'js-yaml'

import { Stage } from '@layerzerolabs/lz-definitions'

import { requireStage } from '../../config/utils/utils.config'

type DisconnectedCheckYamlConfig = {
    deprecated_eids: number[] | number
    active_chains?: string[] | string
}

export type ResolvedDisconnectedCheckConfig = {
    deprecatedEids: number[]
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

    const deprecatedEids = (
        Array.isArray(rawConfig.deprecated_eids) ? rawConfig.deprecated_eids : [rawConfig.deprecated_eids]
    ).map((eid) => {
        if (typeof eid !== 'number' || !Number.isInteger(eid)) {
            throw new Error(`Invalid EID "${eid}" in deprecated_eids at ${configPath}`)
        }
        return eid
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
