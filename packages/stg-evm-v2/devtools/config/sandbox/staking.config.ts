import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { StakingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import {
    OmniGraphHardhat,
    createConnectedContractFactory,
    createContractFactory,
    createGetHreByEid,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetLPTokenAddresses } from '../../../ts-src/utils/util'

import { onBsc, onEth, onPolygon } from './utils'

const staking = { contractName: 'StargateStaking' }
const rewarder = { contractName: 'StargateMultiRewarder' }

export default async (): Promise<OmniGraphHardhat<StakingNodeConfig, never>> => {
    const getEnvironment = createGetHreByEid()
    const contractFactory = createConnectedContractFactory(createContractFactory(getEnvironment))

    const ethStaking = onEth(staking)
    const bscStaking = onBsc(staking)
    const polygonStaking = onPolygon(staking)

    // Get the rewarder contract
    const ethRewarder = await contractFactory(onEth(rewarder))
    const polygonRewarder = await contractFactory(onPolygon(rewarder))

    // Template objects for pool configuration
    //
    // These will need to be populated with a token address and passed to pools configuration
    const ethPool = { rewarder: ethRewarder.contract.address }
    const polygonPool = { rewarder: polygonRewarder.contract.address }

    // Now we collect the LP tokens
    const getLPTokenAddresses = createGetLPTokenAddresses(getEnvironment)
    const ethLPTokenAddresses = await getLPTokenAddresses(EndpointId.ETHEREUM_V2_SANDBOX, [
        TokenName.USDC,
        TokenName.USDT,
    ])
    const polygonLPTokenAddresses = await getLPTokenAddresses(EndpointId.POLYGON_V2_SANDBOX, [TokenName.USDT])

    return {
        contracts: [
            {
                contract: ethStaking,
                config: {
                    pools: [
                        {
                            ...ethPool,
                            token: ethLPTokenAddresses.USDC,
                        },
                        {
                            ...ethPool,
                            token: ethLPTokenAddresses.USDT,
                        },
                    ],
                },
            },
            {
                contract: bscStaking,
                config: {
                    pools: [],
                },
            },
            {
                contract: polygonStaking,
                config: {
                    pools: [
                        {
                            ...polygonPool,
                            token: polygonLPTokenAddresses.USDT,
                        },
                    ],
                },
            },
        ],
        connections: [],
    }
}
