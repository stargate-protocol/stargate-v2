import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../ops/util'

import { DEFAULT_FEE_CONFIG } from './constants'
import { onBsc, onEth, onPolygon } from './utils'

const tokenName = TokenName.USDC
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const bscFeeLibV1 = onBsc(contract)
    const ethFeeLibV1 = onEth(contract)
    const polygonFeeLibV1 = onPolygon(contract)

    const defaultConfig: FeeLibV1EdgeConfig = {
        paused: false,
        feeConfig: DEFAULT_FEE_CONFIG,
    }

    return {
        contracts: [
            {
                contract: bscFeeLibV1,
                config: {},
            },
            {
                contract: ethFeeLibV1,
                config: {},
            },
            {
                contract: polygonFeeLibV1,
                config: {},
            },
        ],
        connections: [
            //
            // Connections originating from BSC
            //
            {
                from: bscFeeLibV1,
                to: ethFeeLibV1,
                config: defaultConfig,
            },
            {
                from: bscFeeLibV1,
                to: polygonFeeLibV1,
                config: defaultConfig,
            },
            //
            // Connections originating from ETH
            //
            {
                from: ethFeeLibV1,
                to: bscFeeLibV1,
                config: defaultConfig,
            },
            {
                from: ethFeeLibV1,
                to: polygonFeeLibV1,
                config: defaultConfig,
            },
            //
            // Connections originating from POLYGON
            //
            {
                from: polygonFeeLibV1,
                to: bscFeeLibV1,
                config: defaultConfig,
            },
            {
                from: polygonFeeLibV1,
                to: ethFeeLibV1,
                config: defaultConfig,
            },
        ],
    }
}
