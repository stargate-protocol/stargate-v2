import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { Stage } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses, createGetNamedAccount, getAssetNetworkConfig } from '../../../ts-src/utils/util'
import { getContractWithEid, getOneSigAddressMaybe } from '../utils'
import {
    filterValidProvidedChains,
    getChainsThatSupportTokenWithType,
    printChains,
    setStage,
} from '../utils/utils.config'

import type { TIP20NodeConfig } from '@stargatefinance/stg-devtools-v2'

/**
 * Builds a TIP-20 stablecoin graph: includes only chains flagged with `isTIP20: true`
 * and binds directly to the token address using an existing ERC20 artifact.
 *
 * Node config includes:
 * - admin?: address to be set as token admin
 * - issuer?: address to grant ISSUER_ROLE to
 * - pauser?: address granted PAUSE_ROLE and UNPAUSE_ROLE
 * - burnBlocked?: address granted BURN_BLOCKED_ROLE
 */
export default async function buildTIP20TokenGraph(
    stage: Stage,
    tokenName: TokenName
): Promise<OmniGraphHardhat<TIP20NodeConfig, unknown>> {
    // Set the correct stage
    setStage(stage)

    // only use the chains defined in the env variable if it is set
    const chainsList = process.env.CHAINS_LIST ? process.env.CHAINS_LIST.split(',') : []

    const validChains = filterValidProvidedChains(
        chainsList,
        // note: will only include chains that are TIP-20 for the given token
        getChainsThatSupportTokenWithType(tokenName, StargateType.Oft, true)
    )
    printChains(`TIP20 ${tokenName} CHAINS_LIST:`, validChains)

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const getStargateMultisigTestnet = createGetNamedAccount(getEnvironment)

    const contracts = await Promise.all(
        validChains.map(async (chain) => {
            const TIP20Address = getAssetNetworkConfig(chain.eid, tokenName).address
            const stargateOnesig = getOneSigAddressMaybe(chain.eid)
            const assetAddresses = await getAssetAddresses(chain.eid, [tokenName])

            // the role will be the stargate onesig if defined, otherwise it will be the token admin if it is a testnet chain
            const onesigRole =
                stargateOnesig !== undefined
                    ? stargateOnesig
                    : stage === Stage.TESTNET
                      ? await getStargateMultisigTestnet(chain.eid, 'tokenAdmin')
                      : undefined

            return {
                // Use a minimal TIP-20 ABI so role getters like PAUSE_ROLE() are available at runtime
                contract: getContractWithEid(chain.eid, { address: TIP20Address, contractName: 'TIP20' }),
                config: {
                    ...(stargateOnesig !== undefined ? { admin: stargateOnesig } : {}),
                    issuer: assetAddresses[tokenName],
                    pauser: onesigRole,
                    burnBlocked: onesigRole,
                },
            }
        })
    )

    return {
        contracts,
        connections: [],
    }
}
