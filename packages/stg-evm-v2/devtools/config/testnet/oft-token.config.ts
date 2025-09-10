import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { MintableNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { getTokenDeployName } from '../../../ops/util'
import { createGetAssetAddresses, getAssetType } from '../../../ts-src/utils/util'
import { getContractWithEid } from '../utils'
import {
    filterValidProvidedChains,
    getChainsThatSupportTokenWithType,
    getChainsThatSupportsUsdtOftByDeployment,
    printChains,
} from '../utils/utils.config'

import { setTestnetStage } from './utils'

export default async (): Promise<OmniGraphHardhat<MintableNodeConfig, unknown>> => {
    // Set the stage to testnet
    setTestnetStage()

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    const usdtOldDeploymentChains = getChainsThatSupportsUsdtOftByDeployment(false)

    // ETH contract pointers (for all WETH OFT)
    const chainsThatSupportEth = filterValidProvidedChains(
        chainsList,
        getChainsThatSupportTokenWithType(TokenName.ETH, StargateType.Oft)
    )
    printChains(`oft.token ETH CHAINS_LIST:`, chainsThatSupportEth)

    const ethContractsWithConfig = await Promise.all(
        chainsThatSupportEth.map(async (chain) => {
            return {
                contract: getContractWithEid(chain.eid, {
                    contractName: getTokenDeployName(TokenName.ETH, getAssetType(chain.eid, TokenName.ETH)),
                }),
                config: {
                    minters: {
                        [(await getAssetAddresses(chain.eid, [TokenName.ETH] as const)).ETH]: true,
                        // if the chain supports usdt, add it to the minters
                        ...(usdtOldDeploymentChains.includes(chain)
                            ? {
                                  [(await getAssetAddresses(chain.eid, [TokenName.USDT] as const)).USDT]: true,
                              }
                            : {}),
                    },
                },
            }
        })
    )

    return {
        contracts: [...ethContractsWithConfig],
        connections: [],
    }
}
