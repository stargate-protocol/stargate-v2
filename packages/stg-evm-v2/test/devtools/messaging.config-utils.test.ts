import {
    type CreditMessagingNetworkConfig,
    DEFAULT_MAX_MESSAGE_SIZE,
    NETWORKS,
    type NetworkConfig,
    type TokenMessagingNetworkConfig,
} from '@stargatefinance/stg-definitions-v2'
import { expect } from 'chai'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import { generateCreditMessagingConfig, generateTokenMessagingConfig } from '../../devtools/config/utils'

import type { OmniEdgeHardhat, OmniPointHardhat } from '@layerzerolabs/devtools-evm-hardhat'
import type { CreditMessagingEdgeConfig, TokenMessagingEdgeConfig } from '@stargatefinance/stg-devtools-v2'

describe('devtools/config utils messaging config generation', () => {
    const sourceWithOverridesEid = EndpointId.BSC_V2_SANDBOX
    const sourceWithDefaultsEid = EndpointId.ETHEREUM_V2_SANDBOX
    const perPathDestinationEid = EndpointId.AVALANCHE_V2_SANDBOX
    const defaultDestinationEid = EndpointId.POLYGON_V2_SANDBOX
    const testEids = [sourceWithOverridesEid, sourceWithDefaultsEid, perPathDestinationEid, defaultDestinationEid]

    const executor = '0x0000000000000000000000000000000000000001'
    const networkMaxMessageSize = 15000
    const perPathMaxMessageSize = 20000

    let originalNetworkConfigs: Partial<Record<EndpointId, NetworkConfig | undefined>>

    beforeEach(() => {
        originalNetworkConfigs = Object.fromEntries(testEids.map((eid) => [eid, NETWORKS[eid]]))

        NETWORKS[sourceWithOverridesEid] = createNetworkConfig({
            creditMessaging: {
                maxMessageSize: networkMaxMessageSize,
                perPathMaxMessageSize: {
                    [perPathDestinationEid]: perPathMaxMessageSize,
                },
            },
            tokenMessaging: {
                maxMessageSize: networkMaxMessageSize,
                perPathMaxMessageSize: {
                    [perPathDestinationEid]: perPathMaxMessageSize,
                },
            },
        })
        NETWORKS[sourceWithDefaultsEid] = createNetworkConfig()
        NETWORKS[perPathDestinationEid] = createNetworkConfig()
        NETWORKS[defaultDestinationEid] = createNetworkConfig()
    })

    afterEach(() => {
        for (const eid of testEids) {
            const originalConfig = originalNetworkConfigs[eid]
            if (originalConfig == null) {
                delete NETWORKS[eid]
            } else {
                NETWORKS[eid] = originalConfig
            }
        }
    })

    it('resolves maxMessageSize precedence for CreditMessaging edges', () => {
        const connections = generateCreditMessagingConfig(createPoints('CreditMessaging'))

        expect(getExecutorMaxMessageSize(connections, sourceWithOverridesEid, perPathDestinationEid)).to.equal(
            perPathMaxMessageSize
        )
        expect(getExecutorMaxMessageSize(connections, sourceWithOverridesEid, defaultDestinationEid)).to.equal(
            networkMaxMessageSize
        )
        expect(getExecutorMaxMessageSize(connections, sourceWithDefaultsEid, perPathDestinationEid)).to.equal(
            DEFAULT_MAX_MESSAGE_SIZE
        )
    })

    it('resolves maxMessageSize precedence for TokenMessaging edges', () => {
        const connections = generateTokenMessagingConfig(createPoints('TokenMessaging'))

        expect(getExecutorMaxMessageSize(connections, sourceWithOverridesEid, perPathDestinationEid)).to.equal(
            perPathMaxMessageSize
        )
        expect(getExecutorMaxMessageSize(connections, sourceWithOverridesEid, defaultDestinationEid)).to.equal(
            networkMaxMessageSize
        )
        expect(getExecutorMaxMessageSize(connections, sourceWithDefaultsEid, perPathDestinationEid)).to.equal(
            DEFAULT_MAX_MESSAGE_SIZE
        )
    })

    const createNetworkConfig = (overrides?: {
        creditMessaging?: Partial<CreditMessagingNetworkConfig>
        tokenMessaging?: Partial<TokenMessagingNetworkConfig>
    }): NetworkConfig => ({
        creditMessaging: {
            creditGasLimit: 1n,
            sendCreditGasLimit: 2n,
            executor,
            ...overrides?.creditMessaging,
        },
        tokenMessaging: {
            nativeDropAmount: 1n,
            taxiGasLimit: 2n,
            busGasLimit: 3n,
            busRideGasLimit: 4n,
            nativeDropGasLimit: 5n,
            maxPassengerCount: 6,
            queueCapacity: 7,
            executor,
            ...overrides?.tokenMessaging,
        },
    })

    const createPoints = (contractName: string): OmniPointHardhat[] =>
        testEids.map((eid) => ({
            eid,
            contractName,
        }))

    const getExecutorMaxMessageSize = (
        connections: Array<OmniEdgeHardhat<CreditMessagingEdgeConfig | TokenMessagingEdgeConfig>>,
        fromEid: EndpointId,
        toEid: EndpointId
    ): number | undefined => {
        const edge = connections.find((connection) => connection.from.eid === fromEid && connection.to.eid === toEid)
        expect(edge, `${fromEid} -> ${toEid}`).to.not.equal(undefined)
        return edge?.config?.sendConfig?.executorConfig?.maxMessageSize
    }
})
