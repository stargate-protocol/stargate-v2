import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { CircleFiatTokenNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import { getCircleFiatTokenProxyDeployName } from '../../../ops/util'
import { createGetAssetAddresses, createGetNamedAccount, getAssetNetworkConfig } from '../../../ts-src/utils/util'
import { getContractWithEid, getOneSigAddressMaybe } from '../utils'
import {
    filterValidProvidedChains,
    getChainsThatSupportTokenWithType,
    isExternalDeployment,
    printChains,
    setStage,
} from '../utils/utils.config'

export default async function buildCircleFiatTokenGraph(
    stage: Stage,
    tokenName: TokenName
): Promise<OmniGraphHardhat<CircleFiatTokenNodeConfig, unknown>> {
    // Set the correct stage
    setStage(stage)

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    const validChains = filterValidProvidedChains(
        chainsList,
        // note: The newer USDC deployments (since December 2024, USDC is deployed and verified from Circle's repo)
        getChainsThatSupportTokenWithType(tokenName, StargateType.Oft)
    )
    printChains(`${tokenName} CHAINS_LIST:`, validChains)

    const proxyContract = { contractName: getCircleFiatTokenProxyDeployName(tokenName) }
    const fiatContract = { contractName: 'FiatTokenV2_2' }

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const getStargateMultisigTestnet = createGetNamedAccount(getEnvironment)

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
            const assetAddresses = await getAssetAddresses(chain.eid, [tokenName])

            // the role will be the stargate onesig if defined, otherwise it will be the testnet admin if it is a testnet chain
            const onesigRole =
                stargateOnesig !== undefined
                    ? stargateOnesig
                    : stage === Stage.TESTNET
                      ? await getStargateMultisigTestnet(chain.eid, 'tokenAdmin')
                      : undefined
            return {
                contract: getContractWithEid(chain.eid, {
                    ...fiatContract,
                    address: tokenProxyAddress.contract.address,
                }),
                config: {
                    // Only set owner if defined in the chain config
                    ...(stargateOnesig !== undefined ? { owner: stargateOnesig } : {}),
                    masterMinter: onesigRole,
                    pauser: onesigRole,
                    rescuer: onesigRole,
                    blacklister: onesigRole,
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
