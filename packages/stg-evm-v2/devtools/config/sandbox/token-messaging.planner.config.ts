import { TokenMessagingEdgeConfig, TokenMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { generateDefaultConnections } from '../utils'

import { onBsc, onEth, onPolygon } from './utils'

const contract = { contractName: 'TokenMessaging' }

export default async (): Promise<OmniGraphHardhat<TokenMessagingNodeConfig, TokenMessagingEdgeConfig>> => {
    const bscTokenMsging = onBsc(contract)
    const ethTokenMsging = onEth(contract)
    const polygonTokenMsging = onPolygon(contract)

    return {
        contracts: [
            {
                contract: ethTokenMsging,
                config: {},
            },
            {
                contract: bscTokenMsging,
                config: {},
            },
            {
                contract: polygonTokenMsging,
                config: {},
            },
        ],
        connections: generateDefaultConnections(
            [bscTokenMsging, ethTokenMsging, polygonTokenMsging],
            (): TokenMessagingEdgeConfig => ({
                fares: {
                    busFare: 1n,
                    busAndNativeDropFare: 2n,
                },
            })
        ),
    }
}
