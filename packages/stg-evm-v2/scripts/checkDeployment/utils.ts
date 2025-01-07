import { backOff } from 'exponential-backoff'

import { parallelProcess } from '@monorepo/common-utils'

export const errorString = 'error'
export const timeoutString = 'timeout'

export enum StargateVersion {
    V1 = 'v1',
    V2 = 'v2',
}

export type ByPathConfig = {
    [fromChainName: string]: {
        [toChainName: string]: Record<string, string | number>
    }
}

export type ByAssetPathConfig = {
    [assetId: string]: ByPathConfig
}

export type ByAssetConfig = {
    [assetId: string]: {
        [chainName: string]: Record<string, string | number>
    }
}

export type ByChainConfig = {
    [chainName: string]: Record<string, string | number>
}

export const printByChainConfig = (title: string, config: ByChainConfig) => {
    console.log(`\n###################### ${title} ######################`)
    console.table(config)
}

export const printByAssetFlattenConfig = (
    title: string,
    config: ByAssetConfig,
) => {
    console.log(`\n###################### ${title} ######################`)
    console.table(
        Object.entries(config).flatMap(([assetId, assetVal]) =>
            Object.entries(assetVal).flatMap(([chainName, chainVal]) => {
                return {
                    assetId,
                    chainName,
                    ...chainVal,
                }
            }),
        ),
    )
}

export const printByPathAndAssetFlattenConfig = (
    title: string,
    config: ByAssetPathConfig,
) => {
    console.log(`\n###################### ${title} ######################`)
    console.table(
        Object.entries(config).flatMap(([assetId, assetVal]) =>
            Object.entries(assetVal).flatMap(([srcChainName, srcChainVal]) => {
                return Object.entries(srcChainVal).flatMap(
                    ([chainName, chainNameVal]) => ({
                        assetId,
                        srcChainName,
                        chainName,
                        ...chainNameVal,
                    }),
                )
            }),
        ),
    )
}

export const printByPathAndAssetConfig = (
    title: string,
    config: ByAssetPathConfig,
) => {
    console.log(`\n###################### ${title} ######################`)
    console.table(
        Object.entries(config).flatMap(([assetId, assetVal]) =>
            Object.entries(assetVal).flatMap(([srcChainName, srcChainVal]) => {
                return {
                    assetId,
                    srcChainName,
                    ...Object.fromEntries(
                        Object.entries(srcChainVal).flatMap(
                            ([chainName, chainNameVal]) =>
                                Object.entries(chainNameVal).map(([k, v]) => [
                                    `${chainName}_${k}`,
                                    v,
                                ]),
                        ),
                    ),
                }
            }),
        ),
    )
}

export const printByPathConfig = (
    title: string,
    config: {
        [fromChainName: string]: {
            [toChainName: string]: Record<string, string | number>
        }
    },
) => {
    console.log(`\n###################### ${title} ######################`)
    console.table(
        Object.entries(config).flatMap(([fromChainName, fromChainVal]) =>
            Object.entries(fromChainVal).flatMap(
                ([toChainName, toChainVal]) => {
                    return {
                        fromChainName,
                        toChainName,
                        ...toChainVal,
                    }
                },
            ),
        ),
    )
}

export const valueOrTimeout = async <T, Y>(
    getter: () => Promise<T>,
    errorValue: Y,
    timeoutValue: Y,
    options?: {
        timeout?: number
    } & Parameters<typeof backOff>[1],
): Promise<T | Y> => {
    return Promise.race([
        backOff(getter, {
            delayFirstAttempt: false,
            jitter: 'full',
            numOfAttempts: 3,
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
            }, options?.timeout ?? 60000)
        }),
    ])
}

export const processPromises = async (
    title: string,
    _promises: (() => Promise<void>)[],
) => {
    let count = 0

    const promises = _promises.map((promise) => {
        return async () => {
            await promise()
            count++
        }
    })

    const printProgress = () =>
        console.log(`[${title}] Processed ${count}/${promises.length}`)

    const interval = setInterval(printProgress, 1000)

    await parallelProcess(promises, 20)

    printProgress()

    clearInterval(interval)
}
