import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { filterConnections, generateTokenMessagingConfig, getContractWithEid, getSafeAddress } from '../../utils'
import { getChainsThatSupportMessaging, getSupportedTokensByEid, validateChains } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getAssetsConfig } from './shared'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : []
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : []

    // check if all chains are valid
    validateChains(toChains)
    validateChains(fromChains)

    // get valid chains in the chainsList
    const supportedChains = getChainsThatSupportMessaging()
    const validFromChains =
        fromChains?.length != 0 ? supportedChains.filter((chain) => fromChains.includes(chain.name)) : supportedChains
    const validToChains =
        toChains?.length != 0 ? supportedChains.filter((chain) => toChains.includes(chain.name)) : supportedChains

    console.log(
        'TOKEN_MESSAGING FROM_CHAINS:',
        validFromChains.map((chain) => chain.name)
    )
    console.log(
        'TOKEN_MESSAGING TO_CHAINS:',
        validToChains.map((chain) => chain.name)
    )

    const fromContracts = validFromChains.map((chain) => getContractWithEid(chain.eid, contract))
    const toContracts = validToChains.map((chain) => getContractWithEid(chain.eid, contract))

    const contractMap = new Map()

    fromContracts.forEach((contract) => contractMap.set(contract.eid, contract))

    toContracts.forEach((contract) => contractMap.set(contract.eid, contract))

    const allContracts = Array.from(contractMap.values())
    const allConnections = generateTokenMessagingConfig(allContracts)
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
