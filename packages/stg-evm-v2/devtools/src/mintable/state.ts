import { OmniGraphBuilder, OmniNode, OmniPoint } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { getFromCacheOrChain } from '../utils/cache'

import { createMintableFactory } from './factory'
import { MintableNodeConfig, MintableOmniGraph } from './types'

export async function loadMintableState(configGraph: MintableOmniGraph): Promise<MintableOmniGraph> {
    const logger = createModuleLogger(`State Loader for Mintable`)
    logger.verbose('Loading Mintable state...')

    const nodePromises: Promise<OmniNode<MintableNodeConfig>>[] = configGraph.contracts.map(({ point, config }) =>
        getFromCacheOrChain('MintableNode', point, () => getNodeFromChain(point, config))
    )

    return Promise.all(nodePromises).then(
        (nodes) => new OmniGraphBuilder<MintableNodeConfig, unknown>().addNodes(...nodes).graph
    )
}

async function getNodeFromChain(
    point: OmniPoint,
    existingConfig: MintableNodeConfig
): Promise<OmniNode<MintableNodeConfig>> {
    const logger = createModuleLogger(`State Loader for Mintable`)
    const createSdk = createMintableFactory(createConnectedContractFactory())
    const sdk = await createSdk(point)

    logger.debug(`Querying ${getNetworkNameForEid(point.eid)}...`)

    if (!existingConfig.minters) {
        return { point, config: { minters: {} } }
    }

    const mintersOnChain: Record<string, boolean> = Object.fromEntries(
        await Promise.all(
            Object.keys(existingConfig.minters).map(async (minter) => [minter, await sdk.isMinter(minter)])
        )
    )

    const config: MintableNodeConfig = { minters: mintersOnChain }
    return { point, config }
}
