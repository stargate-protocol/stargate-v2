import { OmniEdge, OmniGraphBuilder, OmniNode, OmniPoint, OmniVector } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { getFromCacheOrChain } from '../utils/cache'

import { createAssetFactory } from './factory'
import { AssetEdgeConfig, AssetNodeConfig, AssetOmniGraph } from './types'

export async function loadAssetState(configGraph: AssetOmniGraph): Promise<AssetOmniGraph> {
    const logger = createModuleLogger(`State Loader for Asset`)
    logger.verbose('Loading Asset state...')

    const nodePromises: Promise<OmniNode<AssetNodeConfig>>[] = configGraph.contracts.map(({ point }) =>
        getFromCacheOrChain('AssetNode', point, () => getNodeFromChain(point))
    )

    const edgePromises: Promise<OmniEdge<AssetEdgeConfig>>[] = configGraph.connections.map(({ vector }) =>
        getFromCacheOrChain('AssetEdge', vector.from, () => getEdgeFromChain(vector))
    )

    const graphBuilder = new OmniGraphBuilder<AssetNodeConfig, AssetEdgeConfig>()

    return Promise.all(nodePromises)
        .then((nodes) => graphBuilder.addNodes(...nodes))
        .then(() => Promise.all(edgePromises))
        .then((edges) => graphBuilder.addEdges(...edges))
        .then(() => graphBuilder.graph)
}

async function getNodeFromChain(point: OmniPoint): Promise<OmniNode<AssetNodeConfig>> {
    const logger = createModuleLogger(`State Loader for Asset`)
    const createSdk = createAssetFactory(createConnectedContractFactory())
    const sdk = await createSdk(point)

    logger.debug(`Querying nodes on ${getNetworkNameForEid(point.eid)}...`)

    const config: AssetNodeConfig = {
        // Ownership not in configuration
        // AssetId is not stored in state
        addressConfig: await sdk.getAddressConfig(),
    }
    return { point, config }
}

async function getEdgeFromChain(vector: OmniVector): Promise<OmniEdge<AssetEdgeConfig>> {
    const logger = createModuleLogger(`State Loader for Asset`)
    const createSdk = createAssetFactory(createConnectedContractFactory())
    const sdk = await createSdk(vector.from)

    logger.debug(`Querying edges on ${getNetworkNameForEid(vector.from.eid)}...`)

    const config: AssetEdgeConfig = { isOFT: await sdk.isOFTPath(vector.to.eid) }
    return { vector, config }
}
