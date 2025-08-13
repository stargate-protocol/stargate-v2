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

import { filterConnections, getContractWithEid, getSafeAddress } from '../../utils'
import {
    filterFromAndToChains,
    getChainsThatSupportMessaging,
    getSupportedTokensByEid,
    printChains,
} from '../../utils.config'
import { setMainnetStage } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getAssetsConfig } from './shared'

export default async function buildMessagingGraph(
    contract: { contractName: string },
    messagingType: string,
    generateMessagingConfig: (
        points: OmniPointHardhat[]
    ) => OmniEdgeHardhat<TokenMessagingEdgeConfig | CreditMessagingEdgeConfig>[]
): Promise<
    OmniGraphHardhat<
        TokenMessagingNodeConfig | CreditMessagingNodeConfig,
        TokenMessagingEdgeConfig | CreditMessagingEdgeConfig
    >
> {
    // Set the stage to mainnet
    setMainnetStage()

    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : []
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : []

    // check if all chains are valid
    const supportedChains = getChainsThatSupportMessaging()

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
        allContracts.map(async (contract) => ({
            contract,
            config: {
                owner: getSafeAddress(contract.eid),
                delegate: getSafeAddress(contract.eid),
                planner: DEFAULT_PLANNER,
                assets: await getAssetsConfig(getEnvironment, contract.eid, getSupportedTokensByEid(contract.eid)),
            },
        }))
    )

    return {
        contracts,
        connections: filteredConnections,
    }
}
