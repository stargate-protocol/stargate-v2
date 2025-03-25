import { withEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getContractsInChain, setsDifference } from '../utils'

export const onEth = withEid(EndpointId.SEPOLIA_V2_TESTNET)
export const onBsc = withEid(EndpointId.BSC_V2_TESTNET)
export const onArb = withEid(EndpointId.ARBSEP_V2_TESTNET)
export const onAvalanche = withEid(EndpointId.AVALANCHE_V2_TESTNET)
export const onOpt = withEid(EndpointId.OPTSEP_V2_TESTNET)
export const onKlaytn = withEid(EndpointId.KLAYTN_V2_TESTNET)
export const onBL3 = withEid(EndpointId.BL3_V2_TESTNET)
export const onOdyssey = withEid(EndpointId.ODYSSEY_V2_TESTNET)
export const onMantle = withEid(EndpointId.MANTLESEP_V2_TESTNET)
export const onMonad = withEid(EndpointId.MONAD_V2_TESTNET)

export const chainEids = {
    'avalanche-testnet': EndpointId.AVALANCHE_V2_TESTNET,
    'arbsep-testnet': EndpointId.ARBSEP_V2_TESTNET,
    'bl3-testnet': EndpointId.BL3_V2_TESTNET,
    'bsc-testnet': EndpointId.BSC_V2_TESTNET,
    'klaytn-testnet': EndpointId.KLAYTN_V2_TESTNET,
    'mantle-testnet': EndpointId.MANTLESEP_V2_TESTNET,
    'monad-testnet': EndpointId.MONAD_V2_TESTNET,
    'odyssey-testnet': EndpointId.ODYSSEY_V2_TESTNET,
    'opt-testnet': EndpointId.OPTSEP_V2_TESTNET,
    'sepolia-testnet': EndpointId.SEPOLIA_V2_TESTNET,
}

export const allSupportedChains = new Set(Object.keys(chainEids))

const excludedCreditMessagingChains = new Set([
    'klaytn-testnet',
    // Add chains that should be excluded from credit messaging
])
const excludedTokenMessagingChains = new Set([
    // Add chains that should be excluded from token messaging
])

export const validCreditMessagingChains = setsDifference(allSupportedChains, excludedCreditMessagingChains)
export const validTokenMessagingChains = setsDifference(allSupportedChains, excludedTokenMessagingChains)

export function isValidCreditMessagingChain(chain: string): boolean {
    return validCreditMessagingChains.has(chain)
}

export function isValidTokenMessagingChain(chain: string): boolean {
    return validTokenMessagingChains.has(chain)
}

export function isValidChain(chain: string): boolean {
    return allSupportedChains.has(chain)
}

export function getContracts(chains: string[] | null, contract: any, isValidChain: (chain: string) => boolean) {
    return getContractsInChain(chains, contract, isValidChain, chainEids)
}
