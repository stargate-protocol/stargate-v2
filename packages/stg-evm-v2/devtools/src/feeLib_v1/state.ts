import { OmniGraphBuilder, OmniNode, OmniPoint } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { getFromCacheOrChain } from '../utils/cache'

import { createFeeLibV1Factory } from './factory'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig, FeeLibV1OmniGraph } from './types'

export async function loadFeeLibV1State(configGraph: FeeLibV1OmniGraph): Promise<FeeLibV1OmniGraph> {
    const logger = createModuleLogger(`State Loader for FeeLibV1`)
    logger.verbose('Loading FeeLibV1 state...')

    const nodePromises: Promise<OmniNode<FeeLibV1NodeConfig>>[] = configGraph.contracts.map(({ point }) =>
        getFromCacheOrChain('FeeLibV1Node', point, () => getNodeFromChain(point))
    )

    return Promise.all(nodePromises).then(
        (nodes) => new OmniGraphBuilder<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>().addNodes(...nodes).graph
    )
}

async function getNodeFromChain(point: OmniPoint): Promise<OmniNode<FeeLibV1NodeConfig>> {
    const logger = createModuleLogger(`State Loader for FeeLibV1`)
    const createSdk = createFeeLibV1Factory(createConnectedContractFactory())
    const sdk = await createSdk(point)

    logger.debug(`Querying ${getNetworkNameForEid(point.eid)}...`)

    const config: FeeLibV1NodeConfig = { owner: (await sdk.getOwner()) ?? '0x' }
    return { point, config }
}
