import { withEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getContractsInChain, setsDifference } from '../utils'

export const onEth = withEid(EndpointId.SEPOLIA_V2_TESTNET)
export const onBsc = withEid(EndpointId.BSC_V2_TESTNET)
export const onArb = withEid(EndpointId.ARBSEP_V2_TESTNET)
export const onOpt = withEid(EndpointId.OPTSEP_V2_TESTNET)
export const onKlaytn = withEid(EndpointId.KLAYTN_V2_TESTNET)
export const onBL3 = withEid(EndpointId.BL3_V2_TESTNET)
export const onOdyssey = withEid(EndpointId.ODYSSEY_V2_TESTNET)
export const onMantle = withEid(EndpointId.MANTLESEP_V2_TESTNET)

export const chainFunctions = {
    'arbsep-testnet': onArb,
    'bl3-testnet': onBL3,
    'bsc-testnet': onBsc,
    'klaytn-testnet': onKlaytn,
    'mantle-testnet': onMantle,
    'odyssey-testnet': onOdyssey,
    'opt-testnet': onOpt,
    'sepolia-testnet': onEth,
}

export const allChains = new Set(Object.keys(chainFunctions))

const excludedCreditMessagingChains = new Set([
    // Add chains that should be excluded from credit messaging
])
const excludedTokenMessagingChains = new Set([
    // Add chains that should be excluded from token messaging
])

export const validCreditMessagingChains = setsDifference(allChains, excludedCreditMessagingChains)
export const validTokenMessagingChains = setsDifference(allChains, excludedTokenMessagingChains)

export function isValidCreditMessagingChain(chain: string): boolean {
    return validCreditMessagingChains.has(chain)
}

export function isValidTokenMessagingChain(chain: string): boolean {
    return validTokenMessagingChains.has(chain)
}

export function getContracts(chains: string[] | null, contract: any, isValidChain: (chain: string) => boolean) {
    return getContractsInChain(chains, contract, isValidChain, chainFunctions)
}
