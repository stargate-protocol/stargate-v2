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

export const getContractDeploymentInfo = (
    npmPackage: string,
    contractName: string,
    chainName: string,
    environment: string,
    resolvePackagePath: (path: string) => { address: string }
): { address: string } => {
    const deploymentFolderName = `${chainName}-${environment}`
    return resolvePackagePath(`${npmPackage}/deployments/${deploymentFolderName}/${contractName}.json`)
}

export const throwError = <Err extends Error>(message: string, error?: (message: string) => Err): never => {
    throw error?.(message) ?? new Error(message)
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

    // If coming from VSCode debugger, flatening the args
    // If using Javascript Debug Terminal, they will already be flatened
    if (process.env.VSCODE_INSPECTOR_OPTIONS && process.argv.length === 3) {
        process.argv = [process.argv[0], process.argv[1], ...process.argv[2].split(' ').filter((a) => a)]
    }

    return commandParse<T & IHelp>(
        {
            ...options.args,
            ...helpArgs,
        },
        {
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
