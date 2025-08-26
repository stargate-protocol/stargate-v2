import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { USDCNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import { getUSDCProxyDeployName } from '../../../ops/util'
import { createGetAssetAddresses, createGetNamedAccount, getAssetNetworkConfig } from '../../../ts-src/utils/util'
import { getContractWithEid, getOneSigAddress } from '../utils'
import { getChainsThatSupportTokenWithType, isExternalDeployment, setStage } from '../utils/utils.config'

const proxyContract = { contractName: getUSDCProxyDeployName() }
const fiatContract = { contractName: 'FiatTokenV2_2' }
const tokenName = TokenName.USDC

export default async function buildUsdcTokenGraph(stage: Stage): Promise<OmniGraphHardhat<USDCNodeConfig, unknown>> {
    // Set the correct stage
    setStage(stage)

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const getStargateMultisigTestnet = createGetNamedAccount(getEnvironment)

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

            const stargateMultisig =
                stage === Stage.MAINNET
                    ? getOneSigAddress(chain.eid)
                    : await getStargateMultisigTestnet(chain.eid, 'usdcAdmin')
            const assetAddresses = await getAssetAddresses(chain.eid, [tokenName])
            return {
                contract: getContractWithEid(chain.eid, {
                    ...fiatContract,
                    address: usdcProxyAddress.contract.address,
                }),
                config: {
                    // Only set owner for mainnet
                    ...(stage === Stage.MAINNET ? { owner: stargateMultisig } : {}),
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
