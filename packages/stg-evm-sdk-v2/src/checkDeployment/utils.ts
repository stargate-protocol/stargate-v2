import { backOff } from 'exponential-backoff'

export const errorString = 'error'
export const timeoutString = 'timeout'

type ByPathConfig = {
    [fromChainName: string]: {
        [toChainName: string]: Record<string, string | number>
    }
}

export type ByChainConfig = {
    [chainName: string]: Record<string, string | number>
}

export type ByAssetPathConfig = {
    [assetId: string]: ByPathConfig
}

export type ByAssetConfig = {
    [assetId: string]: {
        [chainName: string]: Record<string, string | number>
    }
}

export const printByChainConfig = (title: string, config: ByChainConfig, onlyError = false) => {
    console.log(`\n###################### ${title} ######################`)

    const flattenedData = Object.entries(config).flatMap(([chainName, results]) => {
        return {
            chainName,
            ...results,
        }
    })
    // Filter the data if onlyError is true
    const dataToDisplay = onlyError
        ? flattenedData.filter((item) =>
              Object.values(item).some((val) => typeof val === 'string' && val.startsWith('error'))
          )
        : flattenedData

    console.table(dataToDisplay)
}

export const printByAssetFlattenConfig = (title: string, config: ByAssetConfig, onlyError = false) => {
    console.log(`\n###################### ${title} ######################`)

    const flattenedData = Object.entries(config).flatMap(([assetId, assetVal]) =>
        Object.entries(assetVal).flatMap(([chainName, chainVal]) => {
            return {
                assetId,
                chainName,
                ...chainVal,
            }
        })
    )

    const dataToDisplay = onlyError ? flattenedData.filter((item) => 'error' in item) : flattenedData

    console.table(dataToDisplay)
}

export const printByPathAndAssetFlattenConfig = (title: string, config: ByAssetPathConfig, onlyError = false) => {
    console.log(`\n###################### ${title} ######################`)

    const flattenedData = Object.entries(config).flatMap(([assetId, assetVal]) =>
        Object.entries(assetVal).flatMap(([srcChainName, srcChainVal]) => {
            return Object.entries(srcChainVal).flatMap(([chainName, chainNameVal]) => ({
                assetId,
                srcChainName,
                chainName,
                ...chainNameVal,
            }))
        })
    )

    const filteredData = onlyError
        ? flattenedData.filter((item) =>
              Object.values(item).some((val) => typeof val === 'string' && val.startsWith('error'))
          )
        : flattenedData

    // Sort the data alphabetically by assetId, then srcChainName, then chainName
    const dataToDisplay = filteredData.sort((a, b) => {
        // First sort by assetId
        const assetIdComparison = a.assetId.localeCompare(b.assetId)
        if (assetIdComparison !== 0) {
            return assetIdComparison
        }
        // If assetId is the same, sort by srcChainName
        const srcChainComparison = a.srcChainName.localeCompare(b.srcChainName)
        if (srcChainComparison !== 0) {
            return srcChainComparison
        }
        // If srcChainName is the same, sort by chainName
        return a.chainName.localeCompare(b.chainName)
    })

    console.table(dataToDisplay)
}

export const valueOrTimeout = async <T, Y>(
    getter: () => Promise<T>,
    errorValue: Y,
    timeoutValue: Y,
    options?: {
        timeout?: number
    } & Parameters<typeof backOff>[1]
): Promise<T | Y> => {
    return Promise.race([
        backOff(getter, {
            delayFirstAttempt: false,
            jitter: 'full',
            numOfAttempts: 50,
            startingDelay: 5000,
            timeMultiple: 3,
            ...options,
        }).catch((err) => {
            console.error(err)
            return errorValue
        }),
        new Promise<T | Y>((resolve) => {
            setTimeout(() => {
                resolve(timeoutValue)
            }, options?.timeout ?? 120000)
        }),
    ])
}

export const parseTargets = (targetsString: string): string[] => {
    if (!targetsString || targetsString.trim() === '') {
        return []
    }
    return targetsString
        .split(',')
        .map((target) => target.trim())
        .filter((target) => target.length > 0)
}
