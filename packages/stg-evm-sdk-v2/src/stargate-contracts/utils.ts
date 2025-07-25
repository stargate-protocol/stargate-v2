import { Chain } from '@layerzerolabs/lz-definitions'

import { staticConfig } from '../stargate-sdks/staticConfig'

export enum ChainStatus {
    //The chain has been fully removed from LayerZero and is not supported in any way
    DEPRECATED = 'DEPRECATED',
    //This currently is the same as active
    INACTIVE = 'INACTIVE',
    //The chain is fully supported
    ACTIVE = 'ACTIVE',
}

export enum ChainType {
    EVM = 'EVM',
}

export class StaticChainConfigs {
    static isZKSyncChain(chainName: string): boolean {
        return [
            'zksync',
            'zklink',
            'zksyncsep',
            Chain.ABSTRACT,
            Chain.SOPHON,
            Chain.TREASURE,
            Chain.CRONOSZKEVM,
            Chain.LENS,
        ].includes(chainName)
    }

    static getChainType(chainName: string): ChainType {
        // For now, all chains in this repo are EVM-based
        // This can be extended if other chain types are added
        return ChainType.EVM
    }

    static getSymbol(chainName: string): string {
        return staticConfig[chainName].symbol
    }

    static getDecimals(chainName: string): number {
        return staticConfig[chainName].decimals
    }
}

export const throwError = <Err extends Error>(message: string, error?: (message: string) => Err): never => {
    throw error?.(message) ?? new Error(message)
}
