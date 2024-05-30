import { OmniEdge, OmniGraphBuilder, OmniNode, OmniPoint, OmniVector, isZero } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { OAppEnforcedOption } from '@layerzerolabs/ua-devtools'
import { createOAppFactory } from '@layerzerolabs/ua-devtools-evm'

import { MessagingAssetConfig } from '../messaging'
import { getFromCacheOrChain } from '../utils/cache'
import { decodeEnforcedOptions } from '../utils/enforcedOptions'

import { createCreditMessagingFactory } from './factory'
import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig, CreditMessagingOmniGraph } from './types'

export async function loadCreditMessagingState(
    configGraph: CreditMessagingOmniGraph
): Promise<CreditMessagingOmniGraph> {
    const logger = createModuleLogger(`State Loader for CreditMessaging`)
    logger.verbose('Loading CreditMessaging state...')

    const nodePromises: Promise<OmniNode<CreditMessagingNodeConfig>>[] = configGraph.contracts.map(
        ({ point, config }) => getFromCacheOrChain('CreditMessagingNode', point, () => getNodeFromChain(point, config))
    )

    const edgePromises: Promise<OmniEdge<CreditMessagingEdgeConfig>>[] = []
    for (const { vector, config } of configGraph.connections) {
        edgePromises.push(
            getFromCacheOrChain('CreditMessagingEdge', vector.from, () => getEdgeFromChain(vector, config)).then(
                (edge) => {
                    // Adapt to account for printing bigints
                    if (edge.config.gasLimit) {
                        edge.config.gasLimit = BigInt(edge.config.gasLimit)
                    }
                    return edge
                }
            )
        )
    }

    const graphBuilder = new OmniGraphBuilder<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>()

    return Promise.all(nodePromises)
        .then((nodes) => graphBuilder.addNodes(...nodes))
        .then(() => Promise.all(edgePromises))
        .then((edges) => graphBuilder.addEdges(...edges))
        .then(() => graphBuilder.graph)
}

async function getNodeFromChain(
    point: OmniPoint,
    existingConfig: CreditMessagingNodeConfig
): Promise<OmniNode<CreditMessagingNodeConfig>> {
    const logger = createModuleLogger(`State Loader for CreditMessaging`)
    const createSdk = createCreditMessagingFactory(createConnectedContractFactory())
    const sdk = await createSdk(point)

    logger.debug(`Querying ${getNetworkNameForEid(point.eid)}...`)

    const onChainAssets: MessagingAssetConfig = !existingConfig.assets
        ? {}
        : Object.fromEntries(
              (
                  await Promise.all(
                      Object.values(existingConfig.assets).map(async (assetId) => [
                          await sdk.getAsset(assetId),
                          assetId,
                      ])
                  )
              ).filter(([assetAddress, _assetId]) => assetAddress)
          )

    const config: CreditMessagingNodeConfig = {
        assets: onChainAssets,
        planner: (await sdk.getPlanner()) ?? '0x',
        maxAssetId: (await sdk.getMaxAssetId()) ?? 0,
    }

    return { point, config }
}

async function getEdgeFromChain(
    vector: OmniVector,
    existingConfig: CreditMessagingEdgeConfig
): Promise<OmniEdge<CreditMessagingEdgeConfig>> {
    const logger = createModuleLogger(`State Loader for CreditMessaging`)
    const createSdk = createCreditMessagingFactory(createConnectedContractFactory())
    const createOappSdk = createOAppFactory(createConnectedContractFactory())
    const sdk = await createSdk(vector.from)
    const oappSdk = await createOappSdk(vector.from)
    const endpointSdk = await oappSdk.getEndpointSDK()

    logger.debug(`Querying edges on ${getNetworkNameForEid(vector.from.eid)}...`)

    const [sendLibrary, recvLibrary] = await Promise.all([
        endpointSdk.getSendLibrary(vector.from.address, vector.to.eid),
        endpointSdk.getReceiveLibrary(vector.from.address, vector.to.eid),
    ])

    const [executorConfig, sendUlnConfig] = sendLibrary
        ? await Promise.all([
              endpointSdk.getExecutorConfig(vector.from.address, sendLibrary ?? '0x', vector.to.eid),
              endpointSdk.getUlnConfig(vector.from.address, sendLibrary ?? '0x', vector.to.eid),
          ])
        : [undefined, undefined]

    const recvUlnConfig = recvLibrary
        ? await endpointSdk.getUlnConfig(vector.from.address, recvLibrary[0] ?? '0x', vector.to.eid)
        : { requiredDVNs: [] }

    const gasLimit = await sdk.getGasLimit(vector.to.eid)

    const enforcedOptions: OAppEnforcedOption[] = []
    const config: CreditMessagingEdgeConfig = {
        enforcedOptions: enforcedOptions,
        gasLimit: gasLimit ?? 0n,
        sendConfig: {
            executorConfig: executorConfig,
            ulnConfig: sendUlnConfig,
        },
        receiveConfig: { ulnConfig: recvUlnConfig },
    }

    if (!existingConfig.enforcedOptions) {
        logger.debug(`No enforced options for ${getNetworkNameForEid(vector.to.eid)}`)
        return { vector, config }
    }

    for (const enforcedOptionsConfig of existingConfig.enforcedOptions) {
        const optionsHex = await oappSdk.getEnforcedOptions(vector.to.eid, enforcedOptionsConfig.msgType)
        if (isZero(optionsHex)) continue

        const options = Options.fromOptions(optionsHex)
        enforcedOptions.push(...decodeEnforcedOptions(options, enforcedOptionsConfig.msgType))
    }
    config.enforcedOptions = enforcedOptions

    return { vector, config }
}
