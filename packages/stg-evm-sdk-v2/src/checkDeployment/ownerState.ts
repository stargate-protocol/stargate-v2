import * as fs from 'fs'
import * as path from 'path'

import { ethers } from 'ethers'

import { isStargateV2SupportedChainName, processPromises, retryWithBackoff } from '../common-utils'
import { getBootstrapChainConfigFromArgs } from '../config'

import { errorString, parseTargets, printByChainConfig, timeoutString, valueOrTimeout } from './utils'

const OWNER_ABI = ['function owner() view returns (address)']

const isEOA = async (provider: ethers.providers.Provider, address: string): Promise<boolean> => {
    try {
        const code = await provider.getCode(address)
        return code === '0x' || code === '0x0'
    } catch (error) {
        console.error(`Error checking if address ${address} is EOA:`, error)
        return false
    }
}

interface DeploymentInfo {
    name: string
    address: string
    hasOwnerFunction: boolean
}

const getDeploymentsForChain = (chainName: string, environment: string): DeploymentInfo[] => {
    const deploymentDir = path.join(__dirname, '..', '..', 'deployments', `${chainName}-${environment}`)

    if (!fs.existsSync(deploymentDir)) {
        return []
    }

    const deployments: DeploymentInfo[] = []

    try {
        const files = fs.readdirSync(deploymentDir)

        for (const file of files) {
            if (!file.endsWith('.json')) {
                continue
            }

            const contractName = file.replace('.json', '')
            const filePath = path.join(deploymentDir, file)

            try {
                const deployment = JSON.parse(fs.readFileSync(filePath, 'utf8'))
                const hasOwnerFunction = checkABIForOwnerFunction(deployment.abi || [])

                deployments.push({
                    name: contractName,
                    address: deployment.address,
                    hasOwnerFunction,
                })
            } catch (error) {
                console.warn(`Failed to parse deployment file ${filePath}:`, error)
            }
        }
    } catch (error) {
        console.warn(`Failed to read deployments directory ${deploymentDir}:`, error)
    }

    return deployments
}

const checkABIForOwnerFunction = (abi: unknown[]): boolean => {
    return abi.some((item: unknown) => {
        const abiItem = item as { type?: string; name?: string; inputs?: unknown[]; stateMutability?: string }
        return (
            abiItem.type === 'function' &&
            abiItem.name === 'owner' &&
            abiItem.inputs &&
            abiItem.inputs.length === 0 &&
            (abiItem.stateMutability === 'view' || abiItem.stateMutability === 'pure')
        )
    })
}

const checkContractOwnership = async (params: {
    chainName: string
    contractName: string
    contractAddress: string
    numRetries: number
    provider: ethers.providers.Provider
}): Promise<string> => {
    const { chainName, contractName, contractAddress, numRetries, provider } = params

    try {
        const contract = new ethers.Contract(contractAddress, OWNER_ABI, provider)
        const ownerAddress = await valueOrTimeout(
            () => retryWithBackoff(() => contract.owner(), numRetries, chainName, `${contractName}.owner()`),
            errorString,
            timeoutString
        )

        if (typeof ownerAddress === 'string' && (ownerAddress === errorString || ownerAddress === timeoutString)) {
            return ownerAddress
        }

        const isOwnerEOA = await isEOA(provider, ownerAddress as string)
        return isOwnerEOA ? `error: EOA ${ownerAddress}` : `OK (owner: ${ownerAddress})`
    } catch (error) {
        return `${contractName} not accessible or no owner function`
    }
}

export const getOwnerState = async (args: {
    environment: string
    only: string
    targets: string
    numRetries?: number
}) => {
    const { environment, only, targets: targetsString, numRetries = 3 } = args
    const targets = parseTargets(targetsString)

    const bootstrapChainConfig = await getBootstrapChainConfigFromArgs(
        {
            environment,
            only,
        },
        isStargateV2SupportedChainName
    )

    const ownerState: Record<string, Record<string, string>> = {}

    await processPromises(
        'OWNER STATE CHECK',
        bootstrapChainConfig.chainNames.flatMap((chainName) => {
            if (targetsString && !targets.includes(chainName)) {
                return []
            }

            ownerState[chainName] = {}

            const deployments = getDeploymentsForChain(chainName, environment)

            // Filter to only contracts that have an owner() function, but skip:
            // - FeeLib contracts (expected to be owned by EOAs - DEFAULT_PLANNER)
            // - Implementation contracts like USDCImpl (ownership is on the proxy, not implementation)
            const contractsWithOwner = deployments.filter(
                (deployment) =>
                    deployment.hasOwnerFunction &&
                    !deployment.name.includes('FeeLib') &&
                    !deployment.name.includes('Impl')
            )

            return contractsWithOwner.map((deployment) => async () => {
                ownerState[chainName][deployment.name] = await checkContractOwnership({
                    chainName,
                    contractName: deployment.name,
                    contractAddress: deployment.address,
                    numRetries,
                    provider: bootstrapChainConfig.providers[chainName],
                })
            })
        })
    )

    return ownerState
}

/**
 * Check that all Stargate contracts are not owned by EOAs
 */
if (require.main === module) {
    const main = async () => {
        const { parse } = await import('../common-utils')

        const args = parse({
            header: 'Check Owner State',
            description: 'Check that all Stargate contracts are not owned by EOAs',
            args: {
                environment: {
                    alias: 'e',
                    type: String,
                    defaultValue: 'mainnet',
                    description: 'the environment',
                },
                only: {
                    alias: 'o',
                    type: String,
                    defaultValue: '',
                    description: 'chain name to check',
                },
                targets: {
                    alias: 't',
                    type: String,
                    defaultValue: '',
                    description: 'chain names to check against',
                },
                numRetries: {
                    alias: 'r',
                    type: Number,
                    defaultValue: 3,
                    description: 'Number of retries for RPC calls before giving up',
                },
                onlyError: {
                    type: Boolean,
                    defaultValue: false,
                    description: 'only print rows with errors',
                },
            },
        })

        const ownerState = await getOwnerState(args)
        printByChainConfig('OWNER STATE', ownerState, args.onlyError)
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
