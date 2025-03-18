import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { filterConnections, generateCreditMessagingConfig, getContractWithEid, getSafeAddress } from '../../utils'
import { getChainsThatSupportMessaging, isValidChain } from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getMessagingAssetConfig } from './shared'

const contract = { contractName: 'CreditMessaging' }

export default async (): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : ''
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : ''

    // check if all chains are valid
    if (toChains) {
        toChains.forEach((chain) => {
            if (!isValidChain(chain)) {
                throw new Error(`Invalid chain: ${chain}`)
            }
        })
    }
    if (fromChains) {
        fromChains.forEach((chain) => {
            if (!isValidChain(chain)) {
                throw new Error(`Invalid chain: ${chain}`)
            }
        })
    }

    // get valid chains in the chainsList
    const supportedChains = getChainsThatSupportMessaging()
    const validFromChains = fromChains
        ? supportedChains.filter((chain) => fromChains.includes(chain.name))
        : supportedChains
    const validToChains = toChains ? supportedChains.filter((chain) => toChains.includes(chain.name)) : supportedChains

    console.log(
        'CREDIT_MESSAGING FROM_CHAINS:',
        validFromChains.map((chain) => chain.name)
    )
    console.log(
        'CREDIT_MESSAGING TO_CHAINS:',
        validToChains.map((chain) => chain.name)
    )

    const fromContracts = validFromChains.map((chain) => getContractWithEid(chain.eid, contract))
    const toContracts = validToChains.map((chain) => getContractWithEid(chain.eid, contract))

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
                owner: getSafeAddress(contract.eid),
                delegate: getSafeAddress(contract.eid),
                planner: DEFAULT_PLANNER,
                assets: assetConfigs[contract.eid as keyof typeof assetConfigs],
            },
        })),
        connections: filteredConnections,
    }
}
