import { withEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getContractsInChain } from '../utils'

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

export const validCreditMessagingChains = new Set([
    'arbsep-testnet',
    'bl3-testnet',
    'bsc-testnet',
    'klaytn-testnet',
    'mantle-testnet',
    'odyssey-testnet',
    'opt-testnet',
    'sepolia-testnet',
    // Add other valid chains for credit messaging
])

export function isValidCreditMessagingChain(chain: string): boolean {
    return validCreditMessagingChains.has(chain)
}

export function getContracts(chains: string[] | null, contract: any, isValidChain: (chain: string) => boolean) {
    return getContractsInChain(chains, contract, isValidChain, chainFunctions)
}
