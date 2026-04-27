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

import { EndpointV2__factory } from '../../../ts-src/typechain-types'
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

async function fetchDefaultLibraries(
    contracts: OmniPointHardhat[],
    getEnvironment: ReturnType<typeof createGetHreByEid>
): Promise<Map<EndpointId, DefaultLibraries>> {
    // Use the first other eid as a reference — LZ uses the same send/receive lib for all destinations per chain
    const referenceEid = contracts[1]?.eid ?? contracts[0]?.eid ?? 0

    const entries = await Promise.all(
        contracts.map(async (contract) => {
            const hre = await getEnvironment(contract.eid)
            const endpointDeployment = await hre.deployments.get('EndpointV2')
            const provider = (hre as any).ethers.provider
            const endpoint = EndpointV2__factory.connect(endpointDeployment.address, provider)
            const otherEid = contract.eid === referenceEid ? contracts[0]?.eid ?? 0 : referenceEid
            const [sendLibrary, receiveLibrary] = await Promise.all([
                endpoint.defaultSendLibrary(otherEid),
                endpoint.defaultReceiveLibrary(otherEid),
            ])
            return [contract.eid, { sendLibrary, receiveLibrary }] as const
        })
    )

    return new Map(entries)
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
        const libraryMap = await fetchDefaultLibraries(allContracts, getEnvironment)
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
    const libraryMap = await fetchDefaultLibraries(allContracts, getEnvironment)
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
