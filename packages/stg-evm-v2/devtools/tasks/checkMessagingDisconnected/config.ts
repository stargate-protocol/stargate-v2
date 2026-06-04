import fs from 'fs'
import path from 'path'

import * as yaml from 'js-yaml'

type DisconnectedCheckYamlConfig = {
    deprecated_eids: number[] | number
    active_chains?: string[] | string
}

export type ResolvedDisconnectedCheckConfig = {
    deprecatedEids: number[]
    activeChains: string[] | undefined
    configPath: string
}

const CONFIG_PATH = path.join(__dirname, 'messaging.disconnected-check.yml')

export function loadDisconnectedCheckConfig(): ResolvedDisconnectedCheckConfig {
    if (!fs.existsSync(CONFIG_PATH)) {
        throw new Error(`Disconnected check config not found at ${CONFIG_PATH}`)
    }

    const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8')
    const rawConfig = yaml.load(fileContents) as Partial<DisconnectedCheckYamlConfig> | undefined

    if (!rawConfig || typeof rawConfig !== 'object') {
        throw new Error(`Invalid disconnected check config at ${CONFIG_PATH}`)
    }

    if (rawConfig.deprecated_eids == null) {
        throw new Error(`Disconnected check config missing 'deprecated_eids' at ${CONFIG_PATH}`)
    }

    const deprecatedEids = (
        Array.isArray(rawConfig.deprecated_eids) ? rawConfig.deprecated_eids : [rawConfig.deprecated_eids]
    ).map((eid) => {
        if (typeof eid !== 'number' || !Number.isInteger(eid)) {
            throw new Error(`Invalid EID "${eid}" in deprecated_eids at ${CONFIG_PATH}`)
        }
        return eid
    })

    if (!deprecatedEids.length) {
        throw new Error(`Disconnected check config 'deprecated_eids' must not be empty at ${CONFIG_PATH}`)
    }

    let activeChains: string[] | undefined
    if (rawConfig.active_chains != null) {
        const rawList = Array.isArray(rawConfig.active_chains) ? rawConfig.active_chains : [rawConfig.active_chains]
        for (const entry of rawList) {
            if (typeof entry !== 'string' || entry.trim() === '') {
                throw new Error(
                    `Invalid entry "${entry}" in active_chains at ${CONFIG_PATH} — all entries must be non-empty strings`
                )
            }
        }
        const normalized = rawList.map((s) => s.trim())
        if (normalized.length === 0) {
            throw new Error(
                `Disconnected check config 'active_chains' must not be empty when present at ${CONFIG_PATH}`
            )
        }
        activeChains = normalized
    }

    return { deprecatedEids, activeChains, configPath: CONFIG_PATH }
}
