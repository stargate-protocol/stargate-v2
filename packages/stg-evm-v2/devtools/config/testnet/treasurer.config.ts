import { TreasurerNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { buildTreasurerGraphTestnet } from './utils'

const contract = { contractName: 'Treasurer' }

export default async (): Promise<OmniGraphHardhat<TreasurerNodeConfig, unknown>> => {
    return buildTreasurerGraphTestnet(contract)
}
