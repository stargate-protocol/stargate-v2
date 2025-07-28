import { backOff } from 'exponential-backoff'
import { ArgumentConfig, parse as commandParse } from 'ts-command-line-args'

import { Chain, EndpointVersion, Stage, chainAndStageToEndpointId } from '@layerzerolabs/lz-definitions'

/**
 * Semaphore class for controlling access to a resource by multiple processes.
 * It maintains a counter and a queue for managing access.
 */
class Semaphore {
    private counter = 0
    private queue: (() => void)[] = []
    constructor(private max: number) {}

    /**
     * Acquires a lock on the semaphore. If the semaphore is at its maximum,
     * the function will wait until it can acquire the lock.
     * @returns A promise that resolves when the lock has been acquired.
     */
    private async acquire(): Promise<void> {
        if (this.counter >= this.max) {
            await new Promise<void>((resolve) => this.queue.push(resolve))
        }
        this.counter++
    }

    /**
     * Releases a lock on the semaphore.
     */
    private release(): void {
        if (this.counter == 0) return
        this.counter--
        const resolve = this.queue.shift() ?? (() => null)
        resolve()
    }

    /**
     * Executes a given asynchronous callback function, managing concurrency with semaphore locking.
     * The method ensures that the semaphore's lock is acquired before the callback is executed and released after execution.
     * It's the caller's responsibility to handle any errors within the callback.
     * @param callback - An asynchronous function to be executed. It should return a promise. The function is responsible for its own error handling.
     * @returns The promise returned by the callback function. If the callback throws, the error is not caught here and must be handled by the caller.
     */
    async process<T>(callback: () => Promise<T>): Promise<T> {
        await this.acquire()
        try {
            return await callback()
        } finally {
            this.release()
        }
    }
}

/**
 * Processes a batch of items in parallel with controlled concurrency, using a given asynchronous callback function for each item.
 * This function handles concurrency but does not catch errors from the callback functions. Errors must be handled by the caller or within the callback functions themselves.
 * @param callbacks - An array of asynchronous functions that each return a Promise. Each function should handle its own error logic.
 * @param concurrency - The maximum number of callback functions to be executed in parallel.
 * @returns A promise that resolves to an array of the resolved values of the callback functions for each item. If a callback throws, the error must be handled by the caller.
 */
export const parallelProcess = async <T>(
    callbacks: Array<() => Promise<T>>,
    concurrency: number
): Promise<Awaited<T>[]> => {
    const semaphore = new Semaphore(concurrency)
    return Promise.all(callbacks.map((cb) => semaphore.process(cb)))
}

interface IHelp {
    help?: boolean
}

const helpArgs = {
    help: {
        type: Boolean,
        optional: true,
        alias: 'h',
        description: 'Prints this usage guide',
    },
}

export const parse = <T extends { [name: string]: any }>(options: {
    args: ArgumentConfig<T>
    header?: string
    description?: string
    partial?: boolean
}): T & IHelp => {
    // Making sure that every script alway exist on SIGINT and SIGTERM since @temporal/worker {Runtime} does not exit on SIGINT and SIGTERM
    ;['SIGINT', 'SIGTERM'].forEach((signal: string) => {
        process.on(signal, () => {
            process.exit(0)
        })
    })

    // If comming from VSCode debugger, flatening the args
    // If using Javascript Debug Terminal, they will already be flatened
    if (process.env.VSCODE_INSPECTOR_OPTIONS && process.argv.length === 3) {
        process.argv = [process.argv[0], process.argv[1], ...process.argv[2].split(' ').filter((a) => a)]
    }

    return commandParse<T & IHelp>(
        // @ts-ignore
        {
            ...options.args,
            ...helpArgs,
        },
        {
            // @ts-ignore
            helpArg: 'help',
            headerContentSections: [
                {
                    header: options.header || 'Offchain script',
                    content: options.description || 'Probably awesome script but no description',
                },
            ],
            footerContentSections: [
                {
                    header: '---------------------------------',
                    content: `Copyright: LayerZeroLabs Inc.`,
                },
            ],
            partial: (options.partial ?? false) as any,
        }
    )
}

export const errorString = 'error'
export const timeoutString = 'timeout'

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

    // Filter the data if onlyError is true
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

    // Filter the data if onlyError is true
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

export const printByPathAndAssetConfig = (title: string, config: ByAssetPathConfig) => {
    console.log(`\n###################### ${title} ######################`)
    console.table(
        Object.entries(config).flatMap(([assetId, assetVal]) =>
            Object.entries(assetVal).flatMap(([srcChainName, srcChainVal]) => {
                return {
                    assetId,
                    srcChainName,
                    ...Object.fromEntries(
                        Object.entries(srcChainVal).flatMap(([chainName, chainNameVal]) =>
                            Object.entries(chainNameVal).map(([k, v]) => [`${chainName}_${k}`, v])
                        )
                    ),
                }
            })
        )
    )
}

export const printByPathConfig = (
    title: string,
    config: {
        [fromChainName: string]: {
            [toChainName: string]: Record<string, string | number>
        }
    }
) => {
    console.log(`\n###################### ${title} ######################`)
    console.table(
        Object.entries(config).flatMap(([fromChainName, fromChainVal]) =>
            Object.entries(fromChainVal).flatMap(([toChainName, toChainVal]) => {
                return {
                    fromChainName,
                    toChainName,
                    ...toChainVal,
                }
            })
        )
    )
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

export const processPromises = async (title: string, _promises: (() => Promise<void>)[]) => {
    let count = 0

    const promises = _promises.map((promise) => {
        return async () => {
            await promise()
            count++
        }
    })

    const printProgress = () => console.log(`[${title}] Processed ${count}/${promises.length}`)

    const interval = setInterval(printProgress, 1000)

    await parallelProcess(promises, 20)

    printProgress()

    clearInterval(interval)
}

// Note: This doesn't work for UlnVersion.V1
export const getChainIdForEndpointVersion = (
    chainName: string,
    environment: string,
    version: EndpointVersion
): string => {
    // TODO: This is essentially 'getChainIdForNetwork' but skipping the UlnVersion -> EndpointVersion step, refactor monorepo to export this function
    if (environment === 'localnet') {
        environment = 'sandbox'
    }

    return chainAndStageToEndpointId(chainName as Chain, environment as Stage, version).toString()
}

export const environmentToStage = (environment: string): Stage => {
    switch (environment) {
        case 'mainnet':
            return Stage.MAINNET
        case 'testnet':
            return Stage.TESTNET
        case 'localnet':
        case 'sandbox':
            return Stage.SANDBOX
        default:
            throw new Error(`unrecognized environment ${environment}`)
    }
}

export enum StargateVersion {
    V1 = 'v1',
    V2 = 'v2',
}

/**
 * Parses a comma-separated string of targets, trimming whitespace from each target.
 * Handles cases where spaces appear after commas (e.g., "mantle, hemi" -> ["mantle", "hemi"])
 * @param targetsString - The comma-separated string of targets
 * @returns An array of trimmed target strings, or empty array if input is empty
 */
export const parseTargets = (targetsString: string): string[] => {
    if (!targetsString || targetsString.trim() === '') {
        return []
    }
    return targetsString
        .split(',')
        .map((target) => target.trim())
        .filter((target) => target.length > 0)
}
