import { EXPECTED_MESSAGE_LIB_VERSION } from '@stargatefinance/stg-definitions-v2'
import {
    CreditMessagingEdgeConfig,
    CreditMessagingNodeConfig,
    TokenMessagingEdgeConfig,
    TokenMessagingNodeConfig,
} from '@stargatefinance/stg-devtools-v2'

import {
    OmniEdgeHardhat,
    OmniGraphHardhat,
    OmniPointHardhat,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId, Stage } from '@layerzerolabs/lz-definitions'
import { createLogger } from '@layerzerolabs/lz-utilities'

import { filterConnections, getContractWithEid, getOneSigAddressMaybe } from '../utils'

import { getAssetsConfig } from './shared'
import {
    filterFromAndToChains,
    getChainsThatSupportMessaging,
    getNewSupportedChains,
    getSupportedTokensByEid,
    printChains,
    setStage,
} from './utils.config'

const logger = createLogger(process.env.LOG_LEVEL ?? 'info')

// messageLibType() enum values from IMessageLib
const MESSAGE_LIB_TYPE_SEND = 0
const MESSAGE_LIB_TYPE_RECEIVE = 1

type PinnedLibraries = { sendLibrary: string; receiveLibrary: string }

/**
 * Finds the send and receive libraries matching EXPECTED_MESSAGE_LIB_VERSION
 * from the endpoint's registered libraries. Uses first match if multiple found.
 */
async function findExpectedVersionLibraries(provider: any, registeredLibraries: string[]): Promise<PinnedLibraries> {
    // The tasks need to import the TypeChain types dynamically
    // otherwise we end up in a chicken-egg scenario where compile will error out
    // since the TypeChain is not there but TypeChain needs compile
    const { IMessageLib__factory } = await import('../../../ts-src/typechain-types')

    const version = EXPECTED_MESSAGE_LIB_VERSION
    const versionStr = `${version.major}.${version.minor}.${version.endpointVersion}`

    const versioned = await Promise.all(
        registeredLibraries.map(async (address) => {
            try {
                const lib = IMessageLib__factory.connect(address, provider)
                const [{ major, minor, endpointVersion }, libType] = await Promise.all([
                    lib.version(),
                    lib.messageLibType(),
                ])
                return {
                    address,
                    major: Number(major),
                    minor: Number(minor),
                    endpointVersion: Number(endpointVersion),
                    libType: Number(libType),
                }
            } catch (err) {
                const reason = err instanceof Error ? err.message : String(err)
                throw new Error(`Failed to read version/type from registered library ${address}: ${reason}`)
            }
        })
    )

    const matchingLibs = versioned.filter(
        (l) =>
            l.major === Number(version.major) &&
            l.minor === version.minor &&
            l.endpointVersion === version.endpointVersion
    )

    const sendLibs = matchingLibs.filter((l) => l.libType === MESSAGE_LIB_TYPE_SEND)
    const receiveLibs = matchingLibs.filter((l) => l.libType === MESSAGE_LIB_TYPE_RECEIVE)

    if (!sendLibs[0]) throw new Error(`No send library matching version ${versionStr} found in registered libraries.`)
    if (!receiveLibs[0])
        throw new Error(`No receive library matching version ${versionStr} found in registered libraries.`)

    if (sendLibs.length > 1)
        logger.warn(
            `Multiple send libraries match version ${versionStr}. Using ${sendLibs[0].address}, ignoring: ${sendLibs
                .slice(1)
                .map((l) => l.address)
                .join(', ')}.`
        )
    if (receiveLibs.length > 1)
        logger.warn(
            `Multiple receive libraries match version ${versionStr}. Using ${receiveLibs[0].address}, ignoring: ${receiveLibs
                .slice(1)
                .map((l) => l.address)
                .join(', ')}.`
        )

    return { sendLibrary: sendLibs[0].address, receiveLibrary: receiveLibs[0].address }
}

/**
 * For each contract, queries the endpoint's registered libraries and pins
 * the send/receive library matching EXPECTED_MESSAGE_LIB_VERSION.
 */
async function fetchExpectedVersionLibraries(
    contracts: OmniPointHardhat[],
    getEnvironment: ReturnType<typeof createGetHreByEid>
): Promise<Map<EndpointId, PinnedLibraries>> {
    // The tasks need to import the TypeChain types dynamically
    // otherwise we end up in a chicken-egg scenario where compile will error out
    // since the TypeChain is not there but TypeChain needs compile
    const { EndpointV2__factory } = await import('../../../ts-src/typechain-types')

    const entries = await Promise.all(
        contracts.map(async (contract) => {
            let endpointAddress: string | undefined
            try {
                const hre = await getEnvironment(contract.eid)
                const endpointDeployment = await hre.deployments.get('EndpointV2')
                endpointAddress = endpointDeployment.address
                const provider = (hre as any).ethers.provider
                const endpoint = EndpointV2__factory.connect(endpointDeployment.address, provider)
                const registeredLibraries = await endpoint.getRegisteredLibraries()
                const libraries = await findExpectedVersionLibraries(provider, registeredLibraries)
                return [contract.eid, libraries] as const
            } catch (err) {
                const reason = err instanceof Error ? err.message : String(err)
                const endpointInfo = endpointAddress ? ` (EndpointV2 ${endpointAddress})` : ''
                throw new Error(
                    `Failed to fetch expected message library version for eid ${contract.eid}${endpointInfo}: ${reason}`
                )
            }
        })
    )

    return new Map(entries)
}

/**
 * Enriches connections with the pinned send/receive libraries so they are
 * explicitly set to the expected version instead of falling back to the endpoint default.
 */
function pinLibrariesOnConnections<T extends TokenMessagingEdgeConfig | CreditMessagingEdgeConfig>(
    connections: OmniEdgeHardhat<T>[],
    libraryMap: Map<EndpointId, PinnedLibraries>
): OmniEdgeHardhat<T>[] {
    return connections.map((edge) => {
        const libs = libraryMap.get(edge.from.eid)
        if (!libs) return edge
        return {
            ...edge,
            config: {
                ...edge.config,
                sendLibrary: libs.sendLibrary,
                receiveLibraryConfig: { receiveLibrary: libs.receiveLibrary, gracePeriod: 0n },
            },
        }
    })
}

export default async function buildMessagingGraph(
    stage: Stage,
    contract: { contractName: string },
    messagingType: string,
    defaultPlanner: string,
    generateMessagingConfig: (
        points: OmniPointHardhat[]
    ) => OmniEdgeHardhat<TokenMessagingEdgeConfig | CreditMessagingEdgeConfig>[]
): Promise<
    OmniGraphHardhat<
        TokenMessagingNodeConfig | CreditMessagingNodeConfig,
        TokenMessagingEdgeConfig | CreditMessagingEdgeConfig
    >
> {
    // Set the correct stage
    setStage(stage)

    // check if all chains are valid
    const supportedChains = getChainsThatSupportMessaging()

    // NEW_CHAIN mode: generate all connections to/from each new chain (and between
    // new chains, without duplicating them). Node config is emitted for all chains
    // so the edge graph can reference them; txs are only generated where on-chain
    // state diverges from config.
    const { newChainMode, newChains } = getNewSupportedChains(supportedChains)
    if (newChainMode) {
        if (newChains.length === 0) {
            // None of the requested new chains support messaging — empty graph
            return { contracts: [], connections: [] }
        }

        const allContracts = supportedChains.map((chain) => getContractWithEid(chain.eid, contract))
        // Include ALL contracts so edges can reference them in the graph.
        // The framework will only generate transactions for actual config differences.
        const getEnvironment = createGetHreByEid()
        const libraryMap = await fetchExpectedVersionLibraries(allContracts, getEnvironment)
        const allConnections = pinLibrariesOnConnections(generateMessagingConfig(allContracts), libraryMap)
        const filteredConnections = filterConnections(allConnections, [], [])

        const contracts = await Promise.all(
            allContracts.map(async (c) => {
                const stargateOnesig = getOneSigAddressMaybe(c.eid)
                return {
                    contract: c,
                    config: {
                        ...(stargateOnesig !== undefined ? { owner: stargateOnesig } : {}),
                        ...(stargateOnesig !== undefined ? { delegate: stargateOnesig } : {}),
                        planner: defaultPlanner,
                        assets: await getAssetsConfig(getEnvironment, c.eid, getSupportedTokensByEid(c.eid)),
                    },
                }
            })
        )

        return {
            contracts,
            connections: filteredConnections,
        }
    }

    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : []
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : []

    // Get valid chains config for the chains in the fromChains and toChains
    const { validFromChains, validToChains } = filterFromAndToChains(fromChains, toChains, supportedChains)

    printChains(`${messagingType} FROM_CHAINS:`, validFromChains)
    printChains(`${messagingType} TO_CHAINS:`, validToChains)

    const fromContracts = validFromChains.map((chain) => getContractWithEid(chain.eid, contract))
    const toContracts = validToChains.map((chain) => getContractWithEid(chain.eid, contract))

    const contractMap = new Map()

    fromContracts.forEach((contract) => contractMap.set(contract.eid, contract))
    toContracts.forEach((contract) => contractMap.set(contract.eid, contract))

    const allContracts = Array.from(contractMap.values())
    const getEnvironment = createGetHreByEid()
    const libraryMap = await fetchExpectedVersionLibraries(allContracts, getEnvironment)
    const allConnections = pinLibrariesOnConnections(generateMessagingConfig(allContracts), libraryMap)
    const filteredConnections = filterConnections(allConnections, fromContracts, toContracts)

    const contracts = await Promise.all(
        allContracts.map(async (contract) => {
            const stargateOnesig = getOneSigAddressMaybe(contract.eid)
            return {
                contract,
                config: {
                    // Only set owner and delegate if they are defined in the chain config
                    ...(stargateOnesig !== undefined ? { owner: stargateOnesig } : {}),
                    ...(stargateOnesig !== undefined ? { delegate: stargateOnesig } : {}),
                    planner: defaultPlanner,
                    assets: await getAssetsConfig(getEnvironment, contract.eid, getSupportedTokensByEid(contract.eid)),
                },
            }
        })
    )

    return {
        contracts,
        connections: filteredConnections,
    }
}
