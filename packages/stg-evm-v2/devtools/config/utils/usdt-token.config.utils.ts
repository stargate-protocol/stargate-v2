import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'
import { OwnableNodeConfig } from '@layerzerolabs/ua-devtools'

import { createGetAssetAddresses, getAssetNetworkConfig } from '../../../ts-src/utils/util'
import { getContractWithEid } from '../utils'
import {
    filterValidProvidedChains,
    getChainsThatSupportsUsdtOftByDeployment,
    printChains,
    setStage,
} from '../utils/utils.config'

const fiatContract = { contractName: 'TetherTokenV2' }

const tokenName = TokenName.USDT

export default async function buildUsdtTokenGraph(stage: Stage): Promise<OmniGraphHardhat<OwnableNodeConfig, unknown>> {
    // Set the correct stage
    setStage(stage)

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    // get the list of chains that supports usdt external deployments (oft usdt with external deployment)
    const chainsThatSupports = getChainsThatSupportsUsdtOftByDeployment(true)

    // get valid chains config in the chainsList
    const validChains = filterValidProvidedChains(chainsList, chainsThatSupports)

    printChains(`${tokenName} CHAINS_LIST:`, validChains)

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)

    const contracts = await Promise.all(
        validChains.map(async (chain) => {
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
