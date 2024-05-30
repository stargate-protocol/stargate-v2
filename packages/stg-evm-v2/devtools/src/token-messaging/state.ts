import { OmniEdge, OmniGraphBuilder, OmniNode, OmniPoint, OmniVector, isZero } from '@layerzerolabs/devtools'
import { createConnectedContractFactory, getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { OAppEnforcedOption } from '@layerzerolabs/ua-devtools'
import { createOAppFactory } from '@layerzerolabs/ua-devtools-evm'

import { MessagingAssetConfig } from '../messaging'
import { getFromCacheOrChain } from '../utils/cache'
import { decodeEnforcedOptions } from '../utils/enforcedOptions'

import { createTokenMessagingFactory } from './factory'
import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig, TokenMessagingOmniGraph } from './types'

export async function loadTokenMessagingState(configGraph: TokenMessagingOmniGraph): Promise<TokenMessagingOmniGraph> {
    const logger = createModuleLogger(`State Loader for TokenMessaging`)
    logger.verbose('Loading TokenMessaging state...')

    const nodePromises: Promise<OmniNode<TokenMessagingNodeConfig>>[] = []
    for (const { point, config } of configGraph.contracts) {
        nodePromises.push(getFromCacheOrChain('TokenMessagingNode', point, () => getNodeFromChain(point, config)))
    }

    const edgePromises: Promise<OmniEdge<TokenMessagingEdgeConfig>>[] = []
    for (const { vector, config } of configGraph.connections) {
        edgePromises.push(
            getFromCacheOrChain('TokenMessagingEdge', vector.from, () => getEdgeFromChain(vector, config)).then(
                (edge) => {
                    // Adapt to account for printing bigints
                    if (edge.config.gasLimit) {
                        edge.config.gasLimit.gasLimit = BigInt(edge.config.gasLimit.gasLimit)
                        edge.config.gasLimit.nativeDropGasLimit = BigInt(edge.config.gasLimit.nativeDropGasLimit)
                    }
                    if (edge.config.nativeDropAmount) {
                        edge.config.nativeDropAmount = BigInt(edge.config.nativeDropAmount)
                    }
                    return edge
                }
            )
        )
    }

    const graphBuilder = new OmniGraphBuilder<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>()

    return Promise.all(nodePromises)
        .then((nodes) => graphBuilder.addNodes(...nodes))
        .then(() => Promise.all(edgePromises))
        .then((edges) => graphBuilder.addEdges(...edges))
        .then(() => graphBuilder.graph)
}

async function getNodeFromChain(
    point: OmniPoint,
    existingConfig: TokenMessagingNodeConfig
): Promise<OmniNode<TokenMessagingNodeConfig>> {
    const logger = createModuleLogger(`State Loader for TokenMessaging`)
    const createSdk = createTokenMessagingFactory(createConnectedContractFactory())
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

    const config: TokenMessagingNodeConfig = {
        planner: (await sdk.getPlanner()) ?? '0x',
        maxAssetId: (await sdk.getMaxAssetId()) ?? 0,
        assets: onChainAssets,
    }
    return { point, config }
}

async function getEdgeFromChain(
    vector: OmniVector,
    existingConfig: TokenMessagingEdgeConfig
): Promise<OmniEdge<TokenMessagingEdgeConfig>> {
    const logger = createModuleLogger(`State Loader for TokenMessaging`)
    const createSdk = createTokenMessagingFactory(createConnectedContractFactory())
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
        : { requiredDVNs: undefined }

    const [maxPassengers, gasLimit, nativeDropAmount] = await Promise.all([
        sdk.getMaxPassengers(vector.to.eid),
        sdk.getGasLimit(vector.to.eid),
        sdk.getNativeDropAmount(vector.to.eid),
    ])

    const config: TokenMessagingEdgeConfig = {
        // Fares not part of the config, they are set by the planner
        enforcedOptions: [],
        maxPassengers: maxPassengers ?? 0,
        gasLimit: gasLimit ?? { gasLimit: 0n, nativeDropGasLimit: 0n },
        nativeDropAmount: nativeDropAmount ?? 0n,
        sendConfig: {
            executorConfig,
            ulnConfig: sendUlnConfig, // confirmations is not in the config
        },
        receiveConfig: { ulnConfig: { requiredDVNs: recvUlnConfig?.requiredDVNs ?? [] } },
    }

    if (!existingConfig.enforcedOptions) {
        logger.debug(`No enforced options for ${getNetworkNameForEid(vector.to.eid)}`)
        return { vector, config }
    }

    const enforcedOptions: OAppEnforcedOption[] = []
    for (const enforcedOptionsConfig of existingConfig.enforcedOptions) {
        const optionsHex = await oappSdk.getEnforcedOptions(vector.to.eid, enforcedOptionsConfig.msgType)
        if (isZero(optionsHex)) continue

        const options = Options.fromOptions(optionsHex)
        enforcedOptions.push(...decodeEnforcedOptions(options, enforcedOptionsConfig.msgType))
    }
    config.enforcedOptions = enforcedOptions

    return { vector, config }
}
