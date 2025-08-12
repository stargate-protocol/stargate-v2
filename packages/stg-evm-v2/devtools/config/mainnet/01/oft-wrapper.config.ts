import { OFTWrapperNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getContractWithEid, getSafeAddress } from '../../utils'
import { filterValidProvidedChains, getAllChainsConfig } from '../../utils.config'
import { setMainnetStage } from '../utils'

const contract = { contractName: 'OFTWrapper' }

export default async (): Promise<OmniGraphHardhat<OFTWrapperNodeConfig, unknown>> => {
    // Set the stage to mainnet
    setMainnetStage()

    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, getAllChainsConfig())

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
