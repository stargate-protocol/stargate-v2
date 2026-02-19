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
import { Stage } from '@layerzerolabs/lz-definitions'

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
        const allConnections = generateMessagingConfig(allContracts)
        const filteredConnections = filterConnections(allConnections, [], [])

        const getEnvironment = createGetHreByEid()
        const newChainContract = getContractWithEid(newChain.eid, contract)
        const stargateOnesig = getOneSigAddressMaybe(newChainContract.eid)

        const newChainNode = {
            contract: newChainContract,
            config: {
                ...(stargateOnesig !== undefined ? { owner: stargateOnesig } : {}),
                ...(stargateOnesig !== undefined ? { delegate: stargateOnesig } : {}),
                planner: defaultPlanner,
                assets: await getAssetsConfig(
                    getEnvironment,
                    newChainContract.eid,
                    getSupportedTokensByEid(newChainContract.eid)
                ),
            },
        }

        return {
            contracts: [newChainNode],
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
    const allConnections = generateMessagingConfig(allContracts)
    const filteredConnections = filterConnections(allConnections, fromContracts, toContracts)

    const getEnvironment = createGetHreByEid()

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
