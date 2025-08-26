import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { CircleFiatTokenNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import { getCircleFiatTokenProxyDeployName } from '../../../ops/util'
import { createGetAssetAddresses, createGetNamedAccount, getAssetNetworkConfig } from '../../../ts-src/utils/util'
import { getContractWithEid, getSafeAddress } from '../utils'
import { getChainsThatSupportTokenWithType, isExternalDeployment, setStage } from '../utils/utils.config'

export default async function buildCircleFiatTokenGraph(
    stage: Stage,
    tokenName: TokenName
): Promise<OmniGraphHardhat<CircleFiatTokenNodeConfig, unknown>> {
    // Set the correct stage
    setStage(stage)

    const proxyContract = { contractName: getCircleFiatTokenProxyDeployName(tokenName) }
    const fiatContract = { contractName: 'FiatTokenV2_2' }

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const getStargateMultisigTestnet = createGetNamedAccount(getEnvironment)

    // note: The newer USDC deployments (since December 2024, USDC is deployed and verified from Circle's repo)
    const chains = getChainsThatSupportTokenWithType(tokenName, StargateType.Oft)
    const contracts = await Promise.all(
        chains.map(async (chain) => {
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

            const stargateMultisig =
                stage === Stage.MAINNET
                    ? getSafeAddress(chain.eid)
                    : await getStargateMultisigTestnet(chain.eid, 'tokenAdmin')
            const assetAddresses = await getAssetAddresses(chain.eid, [tokenName])
            return {
                contract: getContractWithEid(chain.eid, {
                    ...fiatContract,
                    address: tokenProxyAddress.contract.address,
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
