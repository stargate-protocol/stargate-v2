import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { MintableNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { getTokenDeployName, getUSDTDeployName } from '../../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../../ts-src/utils/util'
import { getContractWithEid, getOneSigAddress } from '../../utils'
import {
    filterValidProvidedChains,
    getChainsThatSupportTokenWithType,
    getChainsThatSupportsUsdtOftByDeployment,
    printChains,
} from '../../utils/utils.config'
import { setMainnetStage } from '../utils'

// Both USDC and USDT now (as of 2024-12-10) have their own config files, so this file is just used for WETH Hydra deployments
export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // Set the stage to mainnet
    setMainnetStage()

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    const validChainUSDT = filterValidProvidedChains(chainsList, getChainsThatSupportsUsdtOftByDeployment(false))
    printChains(`USDT OFT TokenCHAINS_LIST:`, validChainUSDT)

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    // USDT Deployment name is the same for all chains
    const usdtContractTemplate = { contractName: getUSDTDeployName() }

    const usdtOldDeploymentContracts = await Promise.all(
        validChainUSDT.map(async (chain) => {
            return {
                contract: getContractWithEid(chain.eid, usdtContractTemplate),
                config: {
                    owner: getOneSigAddress(chain.eid),
                    minters: {
                        [(await getAssetAddresses(chain.eid, [TokenName.USDT] as const)).USDT]: true,
                    },
                },
            }
        })
    )

    // ETH contract pointers (for all WETH OFT)
    const validChainETH = filterValidProvidedChains(
        chainsList,
        getChainsThatSupportTokenWithType(TokenName.ETH, StargateType.Oft)
    )
    printChains(`oft.token ETH CHAINS_LIST:`, validChainETH)

    const ethContractsWithConfig = await Promise.all(
        validChainETH.map(async (chain) => {
            return {
                contract: getContractWithEid(chain.eid, {
                    contractName: getTokenDeployName(TokenName.ETH, getAssetType(chain.eid, TokenName.ETH)),
                }),
                config: {
                    owner: getOneSigAddress(chain.eid),
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
