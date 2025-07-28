import { backOff } from 'exponential-backoff'
import { ArgumentConfig, parse as commandParse } from 'ts-command-line-args'

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

export const parseTargets = (targetsString: string): string[] => {
    if (!targetsString || targetsString.trim() === '') {
        return []
    }
    return targetsString
        .split(',')
        .map((target) => target.trim())
        .filter((target) => target.length > 0)
}
