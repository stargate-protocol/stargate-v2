import { OFTWrapperNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getContractWithEid, getOneSigAddress } from '../../utils'
import { filterValidProvidedChains, getAllChainsConfig, printChains } from '../../utils/utils.config'
import { setMainnetStage } from '../utils'

const contract = { contractName: 'OFTWrapper' }

export default async (): Promise<OmniGraphHardhat<OFTWrapperNodeConfig, unknown>> => {
    // Set the stage to mainnet
    setMainnetStage()

    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, getAllChainsConfig())

    printChains(`oft.wrapper CHAINS_LIST:`, validChains)

    const oftWrappersContracts = validChains.map((chain) => {
        const oftWrapper = getContractWithEid(chain.eid, contract)
        return {
            contract: oftWrapper,
            config: {
                owner: getOneSigAddress(chain.eid),
                oftBps: {}, // adding to avoid error when wiring the oft wrapper
            },
        }
    })

    return {
        contracts: oftWrappersContracts,
        connections: [],
    }
}
