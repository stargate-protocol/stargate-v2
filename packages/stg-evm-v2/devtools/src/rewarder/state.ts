import { OmniGraphBuilder, OmniNode, OmniPoint } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { getFromCacheOrChain } from '../utils/cache'

import { createRewarderFactory } from './factory'
import { RewarderAllocationsConfig, RewarderNodeConfig, RewarderOmniGraph } from './types'

export async function loadRewarderState(configGraph: RewarderOmniGraph): Promise<RewarderOmniGraph> {
    const logger = createModuleLogger(`State Loader for Rewarder`)
    logger.verbose('Loading Rewarder state...')

    const nodePromises: Promise<OmniNode<RewarderNodeConfig>>[] = configGraph.contracts.map(({ point, config }) =>
        getFromCacheOrChain('RewarderNode', point, () => getNodeFromChain(point, config))
    )

    return Promise.all(nodePromises).then(
        (nodes) => new OmniGraphBuilder<RewarderNodeConfig, unknown>().addNodes(...nodes).graph
    )
}

async function getNodeFromChain(
    point: OmniPoint,
    existingConfig: RewarderNodeConfig
): Promise<OmniNode<RewarderNodeConfig>> {
    const logger = createModuleLogger(`State Loader for Rewarder`)
    const createSdk = createRewarderFactory(createConnectedContractFactory())
    const sdk = await createSdk(point)

    logger.debug(`Querying ${getNetworkNameForEid(point.eid)}...`)

    const allocationsOnChain: RewarderAllocationsConfig = Object.fromEntries(
        await Promise.all(
            Object.keys(existingConfig.allocations).map(async (rewardToken) => [
                rewardToken,
                await sdk.getAllocationsByRewardToken(rewardToken),
            ])
        )
    )

    const config: RewarderNodeConfig = { allocations: allocationsOnChain }
    return { point, config }
}
