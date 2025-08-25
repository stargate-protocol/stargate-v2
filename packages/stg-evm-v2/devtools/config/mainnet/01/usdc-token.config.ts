import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getCircleFiatTokenProxyDeployName } from '../../../../ops/util'

const tokenName = TokenName.USDC
const proxyContract = { contractName: getCircleFiatTokenProxyDeployName(tokenName) }
const fiatContract = { contractName: 'FiatTokenV2_2' }

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    return buildUsdcTokenGraphMainnet()
}
