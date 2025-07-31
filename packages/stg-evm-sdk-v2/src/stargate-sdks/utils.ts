import nativeCurrencyConfigs from '../generated-configs/nativeCurrencyConfigs.json'

export function getNativeCurrencyInfo(chainName: string): { decimals: number; symbol: string } {
    const config = nativeCurrencyConfigs[chainName as keyof typeof nativeCurrencyConfigs]

    if (!config || typeof config === 'string' || typeof config === 'number') {
        throw new Error(`Native currency configuration not found for chain: ${chainName}`)
    }

    return {
        decimals: config.decimals,
        symbol: config.symbol,
    }
}

export function getNativeCurrencyDecimals(chainName: string): number {
    return getNativeCurrencyInfo(chainName).decimals
}

export function getNativeCurrencySymbol(chainName: string): string {
    return getNativeCurrencyInfo(chainName).symbol
}
