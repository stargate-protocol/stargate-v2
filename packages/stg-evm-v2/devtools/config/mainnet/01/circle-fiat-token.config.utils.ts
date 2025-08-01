import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { getCircleFiatTokenProxyDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { getContractWithEid, getSafeAddress } from '../../utils'
import { getChainsThatSupportTokenWithType, isExternalDeployment } from '../utils'

// USDCNodeConfig is EURC compatible so we can use it for both EURC and USDC
export default async function buildCircleFiatTokenGraph(
    tokenName: TokenName
): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> {
    const proxyContract = { contractName: getCircleFiatTokenProxyDeployName(tokenName) }
    const fiatContract = { contractName: 'FiatTokenV2_2' }

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    // The newer USDC deployments (since December 2024)
    const chains = getChainsThatSupportTokenWithType(tokenName, StargateType.Oft)
    const contracts = await Promise.all(
        chains.map(async (chain) => {
            let usdcProxyAddress
            if (isExternalDeployment(chain, tokenName)) {
                // if is external deployment, we need to get the fiat token proxy address
                usdcProxyAddress = await contractFactory(
                    getContractWithEid(chain.eid, {
                        contractName: 'FiatTokenProxy',
                        address: getAssetNetworkConfig(chain.eid, tokenName).address, // usdc asset address
                    })
                )
            } else {
                // if is not external deployment, we need to get USDCProxy address
                usdcProxyAddress = await contractFactory(getContractWithEid(chain.eid, proxyContract))
            }

            const stargateMultisig = getSafeAddress(chain.eid)
            const assetAddresses = await getAssetAddresses(chain.eid, [tokenName])
            return {
                contract: getContractWithEid(chain.eid, {
                    ...fiatContract,
                    address: usdcProxyAddress.contract.address,
                }),
                config: {
                    owner: stargateMultisig,
                    masterMinter: stargateMultisig,
                    pauser: stargateMultisig,
                    rescuer: stargateMultisig,
                    blacklister: stargateMultisig,
                    minters: {
                        [assetAddresses[tokenName]]: 2n ** 256n - 1n,
                    },
                },
            }
        })
    )

    return {
        contracts,
        connections: [],
    }
}
