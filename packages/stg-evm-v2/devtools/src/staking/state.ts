import { OmniGraphBuilder, OmniNode, OmniPoint } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { getFromCacheOrChain } from '../utils/cache'

import { createStakingFactory } from './factory'
import { StakingNodeConfig, StakingOmniGraph } from './types'

export async function loadStakingState(configGraph: StakingOmniGraph): Promise<StakingOmniGraph> {
    const logger = createModuleLogger(`State Loader for Staking`)
    logger.verbose('Loading Staking state...')

    const nodePromises: Promise<OmniNode<StakingNodeConfig>>[] = configGraph.contracts.map(({ point, config }) =>
        getFromCacheOrChain('StakingNode', point, () => getNodeFromChain(point, config))
    )

    return Promise.all(nodePromises).then(
        (nodes) => new OmniGraphBuilder<StakingNodeConfig, unknown>().addNodes(...nodes).graph
    )
}

async function getNodeFromChain(
    point: OmniPoint,
    existingConfig: StakingNodeConfig
): Promise<OmniNode<StakingNodeConfig>> {
    const logger = createModuleLogger(`State Loader for Staking`)
    const createSdk = createStakingFactory(createConnectedContractFactory())
    const sdk = await createSdk(point)

    logger.debug(`Querying ${getNetworkNameForEid(point.eid)}...`)

    const poolsOnChain = await Promise.all(
        existingConfig.pools.map(async (pool) => {
            return { token: pool.token, rewarder: (await sdk.getPool(pool.token)) ?? '0x' }
        })
    )

    const config: StakingNodeConfig = { pools: poolsOnChain }
    return { point, config }
}
