import { TreasurerNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import buildTreasurerGraph from '../../utils/treasurer.config.utils'

const contract = { contractName: 'Treasurer' }

export default async (): Promise<OmniGraphHardhat<TreasurerNodeConfig, unknown>> => {
    return buildTreasurerGraph(Stage.MAINNET, contract)
}
