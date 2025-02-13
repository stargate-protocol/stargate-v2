import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { generateTokenMessagingConfig, getSafeAddress } from '../../utils'
import { filterConnections, getContracts, isValidTokenMessagingChain, validTokenMessagingChains } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getMessagingAssetConfig } from './shared'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : [...validTokenMessagingChains]
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : [...validTokenMessagingChains]

    console.log('TOKEN_MESSAGING FROM_CHAINS:', fromChains)
    console.log('TOKEN_MESSAGING TO_CHAINS:', toChains)

    let fromContracts
    let toContracts
    try {
        fromContracts = getContracts(fromChains, contract, isValidTokenMessagingChain)
        toContracts = getContracts(toChains, contract, isValidTokenMessagingChain)
    } catch (error) {
        console.error('Error getting contracts: ', error)
        throw error
    }

    const contractMap = new Map()

    fromContracts.forEach((contract) => contractMap.set(contract.eid, contract))

    toContracts.forEach((contract) => contractMap.set(contract.eid, contract))

    const allContracts = Array.from(contractMap.values())
    const allConnections = generateTokenMessagingConfig(allContracts)
    const filteredConnections = filterConnections(allConnections, fromContracts, toContracts)

    const getEnvironment = createGetHreByEid()
    const assetConfigs = await getMessagingAssetConfig(getEnvironment)

    return {
        contracts: allContracts.map((contract) => ({
            contract,
            config: {
                owner: getSafeAddress(contract.eid),
                delegate: getSafeAddress(contract.eid),
                planner: DEFAULT_PLANNER,
                assets: assetConfigs[contract.eid as keyof typeof assetConfigs],
            },
        })),
        connections: filteredConnections,
    }
}
