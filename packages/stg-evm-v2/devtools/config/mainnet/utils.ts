import fs from 'fs'
import * as path from 'path'

import { RewardTokenName, StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getAssetNetworkConfig } from '../../../ts-src/utils/util'
import { Chain, loadChainConfig } from '../utils'

export function isValidChain(chain: string): boolean {
    const allSupportedChains = getAllSupportedChains()

    return allSupportedChains.includes(chain)
}

export function validateChains(chains: string[], supportedChains: string[]) {
    chains.forEach((chain) => {
        if (!isValidChain(chain)) {
            throw new Error(`Invalid chain: ${chain}`)
        }
    })
}

export function filterValidProvidedChains(providedChains: string[], supportedChains: Chain[]): Chain[] {
    // validate provided chains
    validateChains(
        providedChains,
        supportedChains.map((chain) => chain.name)
    )

    // get valid chains in the provided chains list
    return providedChains?.length != 0
        ? supportedChains.filter((chain) => providedChains.includes(chain.name))
        : supportedChains
}

export function filterFromAndToChains(
    fromChains: string[],
    toChains: string[],
    supportedChains: Chain[]
): { validFromChains: Chain[]; validToChains: Chain[] } {
    const validFromChains = filterValidProvidedChains(fromChains, supportedChains)
    const validToChains = filterValidProvidedChains(toChains, supportedChains)

    return { validFromChains, validToChains }
}

let _supportedChains: Chain[] | undefined

// supported chains
export function getAllChainsConfig(): Chain[] {
    if (_supportedChains !== undefined) {
        return _supportedChains
    }

    const chainsDir = path.join(__dirname, '01/chainsConfig')

    // Read all yml files from the chains directory
    let chainFiles = fs.readdirSync(chainsDir).filter((file: string) => file.endsWith('.yml'))

    // remove template-chain.yml
    chainFiles = chainFiles.filter((file: string) => file !== '0-template-chain.yml')

    // Load and process each chain configuration
    _supportedChains = chainFiles.map((file: string) => {
        const filePath = path.join(chainsDir, file)

        const chainConfig = loadChainConfig(filePath) // Each file contains only one chain

        chainConfig.eid = EndpointId[chainConfig.eid as keyof typeof EndpointId]
        return chainConfig
    })

    // check that all chains have a deployment folder
    _supportedChains = _filterChainsWithDeployments(_supportedChains!)
    return _supportedChains
}

export function getAllSupportedChains(): string[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.map((chain) => chain.name)
}

export function getChainsThatSupportToken(tokenName: string): Chain[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.filter((chain) => chain.tokens?.[tokenName.toLowerCase()])
}

export function getChainsThatSupportTokenWithType(tokenName: string, type: StargateType): Chain[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.filter((chain) => chain.tokens?.[tokenName.toLowerCase()]?.type === type.toLowerCase())
}

export function getChainsThatSupportRewarder(): Chain[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.filter((chain) => chain.rewarder !== undefined)
}

export function getChainsThatSupportStaking(): Chain[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.filter((chain) => chain.staking !== undefined)
}

export function getChainsThatSupportMessaging(): Chain[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.filter((chain) => chain.credit_messaging || chain.token_messaging)
}

export function getChainsThatSupportTreasurer(): Chain[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.filter((chain) => chain.treasurer !== undefined)
}

export function getChainsThatSupportUsdcAdmins(): Chain[] {
    const chainsConfig = getAllChainsConfig()

    return chainsConfig.filter((chain) => chain.usdc_admin === true)
}

export function getChainsThatSupportsUsdtOftByDeployment(isExternal: boolean): Chain[] {
    const supportsOftUsdt = getChainsThatSupportTokenWithType(TokenName.USDT, StargateType.Oft)

    if (isExternal) {
        return supportsOftUsdt.filter((chain) => getAssetNetworkConfig(chain.eid, TokenName.USDT).address !== undefined)
    }

    return supportsOftUsdt.filter((chain) => getAssetNetworkConfig(chain.eid, TokenName.USDT).address === undefined)
}

export function getSupportedTokensByEid(eid: EndpointId): TokenName[] {
    const chain = getAllChainsConfig().find((chain) => chain.eid === eid)
    const tokens = Object.keys(chain?.tokens ?? {}) as TokenName[]

    return tokens.map((token) => getTokenName(token))
}

export function isExternalDeployment(chain: Chain, tokenName: TokenName): boolean {
    return getAssetNetworkConfig(chain.eid, tokenName).address !== undefined
}

//  token Names
export function getRewardTokenName(token: string): RewardTokenName {
    // return the name that match the entry
    const name = Object.entries(RewardTokenName).find(([value]) => value.toLowerCase() === token)?.[0] as
        | RewardTokenName
        | undefined
    if (!name) {
        throw new Error(`Reward Token ${token} not found`)
    }
    return name
}

export function getTokenName(token: string): TokenName {
    // return the name that match the entry
    const name = Object.entries(TokenName).find(([key, value]) => value.toLowerCase() === token)?.[0] as
        | TokenName
        | undefined
    if (!name) {
        throw new Error(`Token ${token} not found`)
    }
    return name
}

function _filterChainsWithDeployments(chains: Chain[]): Chain[] {
    const deploymentsPath = path.join(__dirname, '../../../deployments')
    const deploymentDirs = fs
        .readdirSync(deploymentsPath, { withFileTypes: true })
        // check the directory is not empty
        .filter((dirent) => dirent.isDirectory() && dirent.name !== '.git')
        .map((dirent) => dirent.name)

    return chains.filter((chain) => deploymentDirs.includes(chain.name))
}
