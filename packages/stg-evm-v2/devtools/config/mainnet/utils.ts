import * as path from 'path'

import { RewardTokenName, StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getAssetNetworkConfig } from '../../../ts-src/utils/util'
import { Chain, loadChainsConfig } from '../utils'

export function isValidChain(chain: string): boolean {
    const allSupportedChains = getAllSupportedChains()

    return allSupportedChains.includes(chain)
}

export function validateChains(chains: string[]) {
    chains.forEach((chain) => {
        if (!isValidChain(chain)) {
            throw new Error(`Invalid chain: ${chain}`)
        }
    })
}

// supported chains
export function getAllChainsConfig(): Chain[] {
    const configFilePath = path.join(__dirname, 'chains-config.yml')

    // set the correct eid for the chains
    const chainsConfig = loadChainsConfig(configFilePath).map((chain) => ({
        ...chain,
        eid: EndpointId[chain.eid as keyof typeof EndpointId],
    }))

    return chainsConfig
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
        throw new Error(` Reward Token ${token} not found`)
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
