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

import { EndpointV2__factory, IMessageLib__factory } from '../../../ts-src/typechain-types'
import { filterConnections, getContractWithEid, getOneSigAddressMaybe } from '../utils'

import { getAssetsConfig } from './shared'
import {
    filterFromAndToChains,
    getChainsThatSupportMessaging,
    getNewChain,
    getSupportedTokensByEid,
    printChains,
    setStage,
} from './utils.config'

// messageLibType() enum values from IMessageLib
const MESSAGE_LIB_TYPE_SEND = 0
const MESSAGE_LIB_TYPE_RECEIVE = 1

type PinnedLibraries = { sendLibrary: string; receiveLibrary: string }

/**
 * Finds the send and receive libraries matching EXPECTED_MESSAGE_LIB_VERSION
 * from the endpoint's registered libraries. Throws if no match found.
 */
async function findExpectedVersionLibraries(provider: any, registeredLibraries: string[]): Promise<PinnedLibraries> {
    const versioned = await Promise.all(
        registeredLibraries.map(async (address) => {
            const lib = IMessageLib__factory.connect(address, provider)
            const [{ major, endpointVersion }, libType] = await Promise.all([lib.version(), lib.messageLibType()])
            return { address, major: Number(major), endpointVersion: Number(endpointVersion), libType: Number(libType) }
        })
    )

    const matchingLibs = versioned.filter(
        (l) =>
            l.major === Number(EXPECTED_MESSAGE_LIB_VERSION.major) &&
            l.endpointVersion === EXPECTED_MESSAGE_LIB_VERSION.endpointVersion
    )

    const sendLibrary = matchingLibs.find((l) => l.libType === MESSAGE_LIB_TYPE_SEND)?.address
    const receiveLibrary = matchingLibs.find((l) => l.libType === MESSAGE_LIB_TYPE_RECEIVE)?.address

    if (!sendLibrary || !receiveLibrary) {
        throw new Error(
            `No library matching version major=${EXPECTED_MESSAGE_LIB_VERSION.major}, endpointVersion=${EXPECTED_MESSAGE_LIB_VERSION.endpointVersion} found in registered libraries. ` +
                `Matching libs: ${JSON.stringify(matchingLibs)}. ` +
                `All registered: ${registeredLibraries.join(', ')}`
        )
    }

    return { sendLibrary, receiveLibrary }
}

/**
 * For each contract, queries the endpoint's registered libraries and pins
 * the send/receive library matching EXPECTED_MESSAGE_LIB_VERSION.
 */
async function fetchExpectedVersionLibraries(
    contracts: OmniPointHardhat[],
    getEnvironment: ReturnType<typeof createGetHreByEid>
): Promise<Map<EndpointId, PinnedLibraries>> {
    const entries = await Promise.all(
        contracts.map(async (contract) => {
            const hre = await getEnvironment(contract.eid)
            const endpointDeployment = await hre.deployments.get('EndpointV2')
            const provider = (hre as any).ethers.provider
            const endpoint = EndpointV2__factory.connect(endpointDeployment.address, provider)
            const registeredLibraries = await endpoint.getRegisteredLibraries()
            const libraries = await findExpectedVersionLibraries(provider, registeredLibraries)
            return [contract.eid, libraries] as const
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

    // NEW_CHAIN mode: generate all connections to/from the new chain, node config only for the new chain
    const newChainName = getNewChain()
    if (newChainName) {
        const newChain = supportedChains.find((c) => c.name === newChainName)
        if (!newChain) {
            // Chain doesn't support messaging — return empty graph
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
