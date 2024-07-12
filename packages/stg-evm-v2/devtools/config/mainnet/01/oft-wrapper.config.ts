import { OFTWrapperNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

const contract = { contractName: 'OFTWrapper' }

export default async (): Promise<OmniGraphHardhat<OFTWrapperNodeConfig, unknown>> => {
    return {
        contracts: [],
        connections: [],
    }
}
