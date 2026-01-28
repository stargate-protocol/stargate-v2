import fs from 'fs'
import path from 'path'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import * as yaml from 'js-yaml'

import { filterFromAndToChains, getAllChainsConfig, getTokenName, printChains } from './utils.config'

export type UnwireYamlConfig = {
    asset: string
    disconnect_chains: string[] | string
    remaining_chains: string[] | string
}

export type ResolvedUnwireConfig = {
    tokenName: TokenName
    disconnectChains: string[]
    remainingChains: string[]
    configPath: string
}

const DEFAULT_CONFIG_RELATIVE_PATH = path.join('chainsConfig', 'unwire', 'unwire.asset.yml')

export function loadUnwireConfig(baseDir: string): ResolvedUnwireConfig {
    const configPath = resolveUnwireConfigPath(baseDir)
    const fileContents = fs.readFileSync(configPath, 'utf8')
    const rawConfig = yaml.load(fileContents) as Partial<UnwireYamlConfig> | undefined

    if (!rawConfig || typeof rawConfig !== 'object') {
        throw new Error(`Invalid unwire config at ${configPath}`)
    }

    if (!rawConfig.asset || typeof rawConfig.asset !== 'string') {
        throw new Error(`Unwire config missing 'asset' string at ${configPath}`)
    }

    const tokenName = getTokenName(rawConfig.asset.toLowerCase())
    const disconnectChains = normalizeChainList(rawConfig.disconnect_chains, 'disconnect_chains', configPath)
    const remainingChains = normalizeChainList(rawConfig.remaining_chains, 'remaining_chains', configPath)

    return {
        tokenName,
        disconnectChains,
        remainingChains,
        configPath,
    }
}

export function resolveUnwireChains(disconnectChains: string[], remainingChains: string[]) {
    const supportedChains = getAllChainsConfig()
    const { validFromChains, validToChains } = filterFromAndToChains(disconnectChains, remainingChains, supportedChains)

    printChains(`unwire DISCONNECT_CHAINS:`, validFromChains)
    printChains(`unwire REMAINING_CHAINS:`, validToChains)

    return { validFromChains, validToChains }
}

const resolveUnwireConfigPath = (baseDir: string): string => {
    const configPath = DEFAULT_CONFIG_RELATIVE_PATH

    return path.isAbsolute(configPath) ? configPath : path.resolve(baseDir, configPath)
}

const normalizeChainList = (value: string[] | string | undefined, field: string, configPath: string): string[] => {
    if (value == null) {
        throw new Error(`Unwire config missing '${field}' at ${configPath}`)
    }

    const list = Array.isArray(value) ? value : [value]
    const normalized = list.map((entry) => entry.trim()).filter(Boolean)

    if (!normalized.length) {
        throw new Error(`Unwire config '${field}' must include at least one chain at ${configPath}`)
    }

    return normalized
}
