import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { filterConnections, generateCreditMessagingConfig } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getMessagingAssetConfig } from './shared'
import { getContracts, isValidCreditMessagingChain, validCreditMessagingChains } from './utils'

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : [...validCreditMessagingChains]
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : [...validCreditMessagingChains]

    console.log('CREDIT_MESSAGING FROM_CHAINS:', fromChains)
    console.log('CREDIT_MESSAGING TO_CHAINS:', toChains)

    let fromContracts
    let toContracts
    try {
        fromContracts = getContracts(fromChains, contract, isValidCreditMessagingChain)
        toContracts = getContracts(toChains, contract, isValidCreditMessagingChain)
    } catch (error) {
        console.error('Error getting contracts: ', error)
        throw error
    }

    const contractMap = new Map()

    fromContracts.forEach((contract) => contractMap.set(contract.eid, contract))
    toContracts.forEach((contract) => contractMap.set(contract.eid, contract))

    const allContracts = Array.from(contractMap.values())
    const allConnections = generateCreditMessagingConfig(allContracts)
    const filteredConnections = filterConnections(allConnections, fromContracts, toContracts)

    const getEnvironment = createGetHreByEid()
    const assetConfigs = await getMessagingAssetConfig(getEnvironment)

    return {
        contracts: allContracts.map((contract) => ({
            contract,
            config: {
                planner: DEFAULT_PLANNER,
                assets: assetConfigs[contract.eid as keyof typeof assetConfigs],
            },
        })),
        connections: filteredConnections,
    }
}
