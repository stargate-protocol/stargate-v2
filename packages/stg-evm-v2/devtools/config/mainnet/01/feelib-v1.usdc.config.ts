import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getFeeLibV1DeployName } from '../../../../ops/util'
import { type FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '../../../src/feeLib_v1'
import {
    onArb,
    onAurora,
    onAvax,
    onBase,
    onEth,
    onKlaytn,
    onMantle,
    onOpt,
    onPolygon,
    onRarible,
    onScroll
} from '../utils'

import { DEFAULT_PLANNER } from './constants'

const tokenName = TokenName.USDC
const contract = { contractName: getFeeLibV1DeployName(tokenName) }

export default async (): Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>> => {
    const defaultNodeConfig = {
        owner: DEFAULT_PLANNER,
    }

    const arbFeeLibV1 = onArb(contract)
    const auroraFeeLibV1 = onAurora(contract)
    const avaxFeeLibV1 = onAvax(contract)
    const baseFeeLibV1 = onBase(contract)
    const ethFeeLibV1 = onEth(contract)
    const klaytnFeeLibV1 = onKlaytn(contract)
    const mantleFeeLibV1 = onMantle(contract)
    const optFeeLibV1 = onOpt(contract)
    const polygonFeeLibV1 = onPolygon(contract)
    const raribleFeeLibV1 = onRarible(contract)
    const scrollFeeLibV1 = onScroll(contract)

    return {
        contracts: [
            {
                contract: arbFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: avaxFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: auroraFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: baseFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: ethFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: klaytnFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: mantleFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: optFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: polygonFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: raribleFeeLibV1,
                config: defaultNodeConfig,
            },
            {
                contract: scrollFeeLibV1,
                config: defaultNodeConfig,
            },
        ],
        connections: [],
    }
}
