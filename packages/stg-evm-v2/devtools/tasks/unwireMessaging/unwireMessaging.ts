import {
    CreditMessagingOmniGraphHardhatSchema,
    TokenMessagingOmniGraphHardhatSchema,
    createCreditMessagingFactory,
    createTokenMessagingFactory,
} from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    CreditMessagingOmniGraph,
    ICreditMessaging,
    ITokenMessaging,
    TokenMessagingOmniGraph,
    configureMessagingWithoutPeers,
    configureUnpeerEdges,
} from '@stargatefinance/stg-devtools-v2'
import { subtask } from 'hardhat/config'

import { type Configurator, createConfigureMultiple } from '@layerzerolabs/devtools'
import { createConnectedContractFactory } from '@layerzerolabs/devtools-evm-hardhat'
import {
    SUBTASK_LZ_OAPP_CONFIG_LOAD,
    SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
    SubtaskConfigureTaskArgs,
    SubtaskLoadConfigTaskArgs,
    TASK_LZ_OAPP_WIRE,
} from '@layerzerolabs/ua-devtools-evm-hardhat'

import { TASK_STG_UNWIRE_CREDIT_MESSAGING, TASK_STG_UNWIRE_TOKEN_MESSAGING } from '../constants'
import { wireTask } from '../wireTaskSetup'

// Directional `from`/`to` unwires only carry sendConfig. Only `both` edges carry receiveConfig and should unpeer.
const isFullUnwireEdge = <TEdge extends { config: { receiveConfig?: unknown } }>(edge: TEdge): boolean =>
    edge.config.receiveConfig != null

const configureTokenMessagingUnpeerFullEdges: Configurator<TokenMessagingOmniGraph, ITokenMessaging> = (
    graph,
    createSdk
) => configureUnpeerEdges({ ...graph, connections: graph.connections.filter(isFullUnwireEdge) }, createSdk)

const configureTokenMessagingUnwire = createConfigureMultiple(
    configureMessagingWithoutPeers,
    configureTokenMessagingUnpeerFullEdges
)

const configureCreditMessagingUnpeerFullEdges: Configurator<CreditMessagingOmniGraph, ICreditMessaging> = (
    graph,
    createSdk
) => configureUnpeerEdges({ ...graph, connections: graph.connections.filter(isFullUnwireEdge) }, createSdk)

const configureCreditMessagingUnwire = createConfigureMultiple(
    configureMessagingWithoutPeers,
    configureCreditMessagingUnpeerFullEdges
)

/**
 * Unwire task for token messaging contracts.
 *
 * Reads direction and allowed peers from chainsConfig/<chain>.yml unwire.token_messaging.
 */
wireTask(TASK_STG_UNWIRE_TOKEN_MESSAGING).setAction(async (args, hre) => {
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load token messaging unwire config',
        (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
            runSuper({
                ...args,
                schema: TokenMessagingOmniGraphHardhatSchema,
            })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Unwire token messaging: disable executor/DVN and remove peers',
        (args: SubtaskConfigureTaskArgs<TokenMessagingOmniGraph, ITokenMessaging>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureTokenMessagingUnwire,
                sdkFactory: createTokenMessagingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})

/**
 * Unwire task for credit messaging contracts.
 *
 * Reads direction and allowed peers from chainsConfig/<chain>.yml unwire.credit_messaging.
 */
wireTask(TASK_STG_UNWIRE_CREDIT_MESSAGING).setAction(async (args, hre) => {
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load credit messaging unwire config',
        (args: SubtaskLoadConfigTaskArgs, hre, runSuper) =>
            runSuper({
                ...args,
                schema: CreditMessagingOmniGraphHardhatSchema,
            })
    )
    subtask(
        SUBTASK_LZ_OAPP_WIRE_CONFIGURE,
        'Unwire credit messaging: disable executor/DVN and remove peers',
        (args: SubtaskConfigureTaskArgs<CreditMessagingOmniGraph, ICreditMessaging>, hre, runSuper) =>
            runSuper({
                ...args,
                configurator: configureCreditMessagingUnwire,
                sdkFactory: createCreditMessagingFactory(createConnectedContractFactory()),
            })
    )

    return hre.run(TASK_LZ_OAPP_WIRE, args)
})
