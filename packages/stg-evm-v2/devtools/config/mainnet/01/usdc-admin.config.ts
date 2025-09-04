import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { CircleFiatTokenNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { getCircleFiatTokenProxyDeployName } from '../../../../ops/util'
import { getAssetNetworkConfig } from '../../../../ts-src/utils/util'
import { getContractWithEid, getOneSigAddressMaybe } from '../../utils'
import {
    filterValidProvidedChains,
    getChainsThatSupportTokenWithType,
    isExternalDeployment,
    printChains,
} from '../../utils/utils.config'
import { setMainnetStage } from '../utils'

const tokenName = TokenName.USDC

export default async (): Promise<OmniGraphHardhat<CircleFiatTokenNodeConfig, unknown>> => {
    // Set the correct stage
    setMainnetStage()

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    const validChains = filterValidProvidedChains(
        chainsList,
        // note: The newer USDC deployments (since December 2024, USDC is deployed and verified from Circle's repo)
        getChainsThatSupportTokenWithType(tokenName, StargateType.Oft)
    )
    printChains(`${tokenName} CHAINS_LIST:`, validChains)

    const proxyContract = { contractName: getCircleFiatTokenProxyDeployName(tokenName) }
    const fiatProxyContract = { contractName: 'FiatTokenProxy' }

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const contracts = await Promise.all(
        validChains.map(async (chain) => {
            let tokenProxyAddress
            if (isExternalDeployment(chain, tokenName)) {
                // if is external deployment, we need to get the fiat token proxy address
                tokenProxyAddress = await contractFactory(
                    getContractWithEid(chain.eid, {
                        contractName: 'FiatTokenProxy',
                        address: getAssetNetworkConfig(chain.eid, tokenName).address, // eurc/usdc asset address
                    })
                )
            } else {
                // if is not external deployment, we need to get tokenProxy address
                tokenProxyAddress = await contractFactory(getContractWithEid(chain.eid, proxyContract))
            }

            const stargateOnesig = getOneSigAddressMaybe(chain.eid)
            return {
                contract: getContractWithEid(chain.eid, {
                    ...fiatProxyContract,
                    address: tokenProxyAddress.contract.address,
                }),
                config: {
                    // Only set onesig
                    admin: stargateOnesig,
                },
            }
        })
    )

    return {
        contracts,
        connections: [],
    }
}
