import { OFTWrapperNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getContractWithEid, getSafeAddress } from '../../utils'
import { getAllChainsConfig, validateChains } from '../utils'

const contract = { contractName: 'OFTWrapper' }

export default async (): Promise<OmniGraphHardhat<OFTWrapperNodeConfig, unknown>> => {
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []
    validateChains(chainsList)

    // get valid chains in the chainsList
    const allSupportedChains = getAllChainsConfig()
    const validChains =
        chainsList?.length != 0
            ? allSupportedChains.filter((chain) => chainsList.includes(chain.name))
            : allSupportedChains

    console.log('validChains', validChains)
    console.log('allSupportedChains', allSupportedChains.length)
    console.log('chainsList', chainsList.length, chainsList)

    const oftWrappersContracts = validChains.map((chain) => {
        const oftWrapper = getContractWithEid(chain.eid, contract)
        return {
            contract: oftWrapper,
            config: {
                owner: getSafeAddress(chain.eid),
            },
        }
    })

    return {
        contracts: oftWrappersContracts,
        connections: [],
    }
}
