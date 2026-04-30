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

type DefaultLibraries = { sendLibrary: string; receiveLibrary: string }

async function fetchAndValidateDefaultLibraries(
    contracts: OmniPointHardhat[],
    getEnvironment: ReturnType<typeof createGetHreByEid>
): Promise<Map<EndpointId, DefaultLibraries>> {
    const entries = await Promise.all(
        contracts.map(async (contract) => {
            // `defaultSendLibrary(dstEid)` / `defaultReceiveLibrary(srcEid)` need a peer eid.
            // Querying a chain's default for itself isn't a real concept, so pick any other
            // chain in scope. (LZ today uses the same lib across all destinations per chain.)
            const peer = contracts.find((c) => c.eid !== contract.eid)
            if (!peer) {
                throw new Error(
                    `Cannot fetch default message libraries for eid ${contract.eid}: at least one other chain must be in scope.`
                )
            }

            const hre = await getEnvironment(contract.eid)
            const endpointDeployment = await hre.deployments.get('EndpointV2')
            const provider = (hre as any).ethers.provider
            const endpoint = EndpointV2__factory.connect(endpointDeployment.address, provider)

            const [sendLibrary, receiveLibrary] = await Promise.all([
                endpoint.defaultSendLibrary(peer.eid),
                endpoint.defaultReceiveLibrary(peer.eid),
            ])

            await Promise.all([
                assertLibraryVersion(provider, sendLibrary, contract.eid, 'send'),
                assertLibraryVersion(provider, receiveLibrary, contract.eid, 'receive'),
            ])

            return [contract.eid, { sendLibrary, receiveLibrary }] as const
        })
    )

    return new Map(entries)
}

async function assertLibraryVersion(
    provider: unknown,
    libraryAddress: string,
    eid: EndpointId,
    kind: 'send' | 'receive'
): Promise<void> {
    const lib = IMessageLib__factory.connect(libraryAddress, provider as never)
    const onChain = await lib.version()
    const expected = EXPECTED_MESSAGE_LIB_VERSION

    const matches =
        onChain.major.toBigInt() === expected.major &&
        onChain.minor === expected.minor &&
        onChain.endpointVersion === expected.endpointVersion

    if (!matches) {
        const actual = `${onChain.major.toString()}.${onChain.minor}.${onChain.endpointVersion}`
        const want = `${expected.major}.${expected.minor}.${expected.endpointVersion}`
        throw new Error(
            `Default ${kind} library on eid ${eid} (${libraryAddress}) is on version ${actual}, expected ${want}. ` +
                `If LayerZero shipped a new default and Stargate has reviewed it, bump EXPECTED_MESSAGE_LIB_VERSION in stg-definitions-v2 to opt in mesh-wide.`
        )
    }
}

function enrichConnectionsWithLibraries<T extends TokenMessagingEdgeConfig | CreditMessagingEdgeConfig>(
    connections: OmniEdgeHardhat<T>[],
    libraryMap: Map<EndpointId, DefaultLibraries>
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
        const libraryMap = await fetchAndValidateDefaultLibraries(allContracts, getEnvironment)
        const allConnections = enrichConnectionsWithLibraries(generateMessagingConfig(allContracts), libraryMap)
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
    const libraryMap = await fetchAndValidateDefaultLibraries(allContracts, getEnvironment)
    const allConnections = enrichConnectionsWithLibraries(generateMessagingConfig(allContracts), libraryMap)
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
