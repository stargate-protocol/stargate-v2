import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { getContractWithEid } from '../../utils'
import { getChainsThatSupportsUsdtOftByDeployment } from '../../utils/utils.config'
import { setMainnetStage } from '../utils'

const fiatContract = { contractName: 'TetherTokenV2' }

const tokenName = TokenName.USDT

export default async (): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> => {
    // Set the stage to mainnet
    setMainnetStage()

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    // get the list of chains that supports usdt external deployments (oft usdt with external deployment)
    const chains = getChainsThatSupportsUsdtOftByDeployment(true)
    const contracts = await Promise.all(
        chains.map(async (chain) => {
            const usdtProxyAddress = await contractFactory(
                getContractWithEid(chain.eid, {
                    contractName: 'TransparentUpgradeableProxy',
                    address: getAssetNetworkConfig(chain.eid, tokenName).address, // usdt asset address
                })
            )
            const assetAddresses = await getAssetAddresses(chain.eid, [tokenName])
            return {
                contract: getContractWithEid(chain.eid, {
                    ...fiatContract,
                    address: usdtProxyAddress.contract.address,
                }),
                config: {
                    owner: assetAddresses[tokenName],
                },
            }
        })
    )

    return {
        contracts,
        connections: [],
    }
}
