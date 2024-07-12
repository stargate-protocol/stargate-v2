import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../ops/util'

import { DEFAULT_FEE_CONFIG, DEFAULT_PLANNER } from './constants'
import { onArb, onEth, onKlaytn, onOpt } from './utils'

const tokenName = TokenName.USDC
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const ethFeeLibV1 = onEth(contract)
    const optFeeLibV1 = onOpt(contract)
    const arbFeeLibV1 = onArb(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)

    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const defaultEdgeConfig: FeeLibV1EdgeConfig = {
        paused: false,
        feeConfig: DEFAULT_FEE_CONFIG,
    }

    return {
        contracts: [
            {
                contract: ethFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: optFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: arbFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: klaytnFeeLibV1,
                config: defaultNodeConfig,
            },
        ],
        connections: [
            //
            // Connections originating from ETH
            //
            {
                from: ethFeeLibV1,
                to: optFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: ethFeeLibV1,
                to: arbFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: ethFeeLibV1,
                to: klaytnFeeLibV1,
                config: defaultEdgeConfig,
            },

            //
            // Connections originating from OPT
            //
            {
                from: optFeeLibV1,
                to: ethFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: optFeeLibV1,
                to: arbFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: optFeeLibV1,
                to: klaytnFeeLibV1,
                config: defaultEdgeConfig,
            },

            //
            // Connections originating from ARB
            //
            {
                from: arbFeeLibV1,
                to: ethFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: arbFeeLibV1,
                to: optFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: arbFeeLibV1,
                to: klaytnFeeLibV1,
                config: defaultEdgeConfig,
            },

            //
            // Connections originating from KLAYTN
            //
            {
                from: klaytnFeeLibV1,
                to: ethFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: klaytnFeeLibV1,
                to: optFeeLibV1,
                config: defaultEdgeConfig,
            },
            {
                from: klaytnFeeLibV1,
                to: arbFeeLibV1,
                config: defaultEdgeConfig,
            },
        ],
    }
}
