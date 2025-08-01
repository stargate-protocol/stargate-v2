import assert from 'assert'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { getCircleFiatTokenProxyDeployName } from '../../../../ops/util'
import { getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { getContractWithEid, getSafeAddress } from '../../utils'
import { getChainsThatSupportUsdcAdmins } from '../utils'

const tokenName = TokenName.USDC
const proxyContract = { contractName: getCircleFiatTokenProxyDeployName(tokenName) }

// Except for chains where it's deployed externally - which is all chains as of December 2024
const usdcPeaqAsset = getAssetNetworkConfig(EndpointId.PEAQ_V2_MAINNET, tokenName)
assert(usdcPeaqAsset.address != null, `External USDC address not found for PEAQ`)

export default async (): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> => {
    const chains = getChainsThatSupportUsdcAdmins()

    const contracts = chains.map((chain) => {
        if (chain.eid === EndpointId.PEAQ_V2_MAINNET) {
            return {
                contract: getContractWithEid(chain.eid, {
                    contractName: 'FiatTokenProxy',
                    address: usdcPeaqAsset.address,
                }),
                config: {
                    admin: getSafeAddress(chain.eid),
                },
            }
        }

        return {
            contract: getContractWithEid(chain.eid, proxyContract),
            config: {
                admin: getSafeAddress(chain.eid),
            },
        }
    })

    return {
        contracts,
        connections: [],
    }
}
