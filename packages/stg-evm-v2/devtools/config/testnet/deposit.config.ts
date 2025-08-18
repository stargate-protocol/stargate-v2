import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { PoolNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { getNamedAccount } from '../../../ts-src/utils/util'
import { getContractWithEid } from '../utils'
import { getChainsThatSupportTokenWithType } from '../utils/utils.config'

const nativePool = { contractName: 'StargatePoolNative' }
const usdcPool = { contractName: 'StargatePoolUSDC' }
const usdtPool = { contractName: 'StargatePoolUSDT' }

export default async (): Promise<OmniGraphHardhat<PoolNodeConfig, unknown>> => {
    const getHre = createGetHreByEid()

    // get all chains that has pool or native pool
    const taggedChains = [
        ...getChainsThatSupportTokenWithType(TokenName.ETH, StargateType.Native).map((chain) => ({
            chain,
            contractName: nativePool,
        })),
        ...getChainsThatSupportTokenWithType(TokenName.USDT, StargateType.Pool).map((chain) => ({
            chain,
            contractName: usdtPool,
        })),
        ...getChainsThatSupportTokenWithType(TokenName.USDC, StargateType.Pool).map((chain) => ({
            chain,
            contractName: usdcPool,
        })),
    ]

    const contracts = await Promise.all(
        taggedChains.map(async (chain) => {
            const hre = await getHre(chain.chain.eid)
            const deployer = await hre.getNamedAccounts().then(getNamedAccount('deployer'))
            return {
                contract: getContractWithEid(chain.chain.eid, chain.contractName),
                config: {
                    depositAmount: {
                        [deployer]: BigInt(18e18),
                    },
                    ...(chain.contractName === nativePool ? { isNative: true } : {}),
                },
            }
        })
    )

    return {
        contracts,
        connections: [],
    }
}
