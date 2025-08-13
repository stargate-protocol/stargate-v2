import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { MintableNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { getTokenDeployName, getUSDTDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../../ts-src/utils/util'
import { getContractWithEid, getSafeAddress } from '../../utils'
import { getChainsThatSupportTokenWithType, getChainsThatSupportsUsdtOftByDeployment } from '../../utils/utils.config'
import { setMainnetStage } from '../utils'

// Both USDC and USDT now (as of 2024-12-10) have their own config files, so this file is just used for WETH Hydra deployments
export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // Set the stage to mainnet
    setMainnetStage()

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    // USDT Deployment name is the same for all chains
    const usdtContractTemplate = { contractName: getUSDTDeployName() }

    const usdtOldDeploymentChains = getChainsThatSupportsUsdtOftByDeployment(false)
    const usdtOldDeploymentContracts = await Promise.all(
        usdtOldDeploymentChains.map(async (chain) => {
            return {
                contract: getContractWithEid(chain.eid, usdtContractTemplate),
                config: {
                    owner: getSafeAddress(chain.eid),
                    minters: {
                        [(await getAssetAddresses(chain.eid, [TokenName.USDT] as const)).USDT]: true,
                    },
                },
            }
        })
    )

    // ETH contract pointers (for all WETH OFT)
    const chainsThatSupportEth = getChainsThatSupportTokenWithType(TokenName.ETH, StargateType.Oft)

    const ethContractsWithConfig = await Promise.all(
        chainsThatSupportEth.map(async (chain) => {
            return {
                contract: getContractWithEid(chain.eid, {
                    contractName: getTokenDeployName(TokenName.ETH, getAssetType(chain.eid, TokenName.ETH)),
                }),
                config: {
                    owner: getSafeAddress(chain.eid),
                    minters: {
                        [(await getAssetAddresses(chain.eid, [TokenName.ETH] as const)).ETH]: true,
                    },
                },
            }
        })
    )

    return {
        contracts: [...ethContractsWithConfig, ...usdtOldDeploymentContracts],
        connections: [],
    }
}
