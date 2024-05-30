import { OmniGraphBuilder, OmniNode, OmniPoint } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { getFromCacheOrChain } from '../utils/cache'

import { createTreasurerFactory } from './factory'
import { TreasurerNodeConfig, TreasurerOmniGraph } from './types'

export async function loadTreasurerState(configGraph: TreasurerOmniGraph): Promise<TreasurerOmniGraph> {
    const logger = createModuleLogger(`State Loader for Treasurer`)
    logger.verbose('Loading Treasurer state...')

    const nodePromises: Promise<OmniNode<TreasurerNodeConfig>>[] = configGraph.contracts.map(({ point, config }) =>
        getFromCacheOrChain('TreasurerNode', point, () => getNodeFromChain(point, config))
    )

    return Promise.all(nodePromises).then(
        (nodes) => new OmniGraphBuilder<TreasurerNodeConfig, unknown>().addNodes(...nodes).graph
    )
}

async function getNodeFromChain(
    point: OmniPoint,
    existingConfig: TreasurerNodeConfig
): Promise<OmniNode<TreasurerNodeConfig>> {
    const logger = createModuleLogger(`State Loader for Treasurer`)
    const createSdk = createTreasurerFactory(createConnectedContractFactory())
    const sdk = await createSdk(point)

    logger.debug(`Querying ${getNetworkNameForEid(point.eid)}...`)

    const onChainAssets = Object.fromEntries(
        await Promise.all(
            Object.keys(existingConfig.assets).map(async (asset) => {
                return [asset, await sdk.getAsset(asset)]
            })
        )
    )

    const config: TreasurerNodeConfig = {
        admin: (await sdk.getAdmin()) ?? '0x',
        assets: onChainAssets,
    }

    return { point, config }
}
