import { OFTWrapperNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getContractWithEid, getSafeAddress } from '../../utils'
import { allSupportedChains, chainEids } from '../utils'

const contract = { contractName: 'OFTWrapper' }

export default async (): Promise<OmniGraphHardhat<OFTWrapperNodeConfig, unknown>> => {
    const oftWrappersContracts = Array.from(allSupportedChains).map((chain) => {
        const eid = chainEids[chain as keyof typeof chainEids]
        const oftWrapper = getContractWithEid(eid, contract)
        return {
            contract: oftWrapper,
            config: {
                owner: getSafeAddress(eid),
                oftBps: {}, // adding to avoid error when wiring the oft wrapper
            },
        }
    })

    return {
        contracts: oftWrappersContracts,
        connections: [],
    }
}
