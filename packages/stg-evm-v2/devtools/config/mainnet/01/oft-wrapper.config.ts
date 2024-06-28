import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { OFTWrapperNodeConfig } from '../../../src/oft-wrapper'

const contract = { contractName: 'OFTWrapper' }

export default async (): Promise<OmniGraphHardhat<OFTWrapperNodeConfig, unknown>> => {
    return {
        contracts: [],
        connections: [],
    }
}
