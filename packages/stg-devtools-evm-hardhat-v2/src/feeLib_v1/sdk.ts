import { FeeConfig, IFeeLibV1 } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, type OmniTransaction, formatEid } from '@layerzerolabs/devtools'
import { printRecord } from '@layerzerolabs/io-devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

import { FeeConfigSchema } from './schema'

import type { EndpointId } from '@layerzerolabs/lz-definitions'

/**
 * The FeeLib configuration is owned by the planner, not by the stargate deployer/initial configurator.
 * But to provide initial values we can use this SDK and configurator.
 */
export class FeeLibV1 extends Ownable implements IFeeLibV1 {
    @AsyncRetriable()
    async getFeeConfig(eid: EndpointId): Promise<FeeConfig> {
        const config = await this.contract.contract.feeConfigs(eid)

        // parse will filter out "paused" which is returned from the contract but is not part of the FeeConfig interface
        return FeeConfigSchema.parse({ ...config })
    }

    async setFeeConfig(
        eid: EndpointId,
        zone1UpperBound: bigint,
        zone2UpperBound: bigint,
        zone1FeeMillionth: bigint, // in millionth (1/1_000_000)
        zone2FeeMillionth: bigint, // in millionth (1/1_000_000)
        zone3FeeMillionth: bigint, // in millionth (1/1_000_000)
        rewardMillionth: bigint
    ): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setFeeConfig', [
            eid,
            zone1UpperBound,
            zone2UpperBound,
            zone1FeeMillionth,
            zone2FeeMillionth,
            zone3FeeMillionth,
            rewardMillionth,
        ])

        const feeConfigRecord = {
            zone1UpperBound,
            zone2UpperBound,
            zone1FeeMillionth,
            zone2FeeMillionth,
            zone3FeeMillionth,
            rewardMillionth,
        }
        return {
            ...this.createTransaction(data),
            description: `Setting feeConfig for ${formatEid(eid)}:\n${printRecord(feeConfigRecord)}`,
        }
    }

    @AsyncRetriable()
    async getPaused(eid: EndpointId): Promise<boolean> {
        return (await this.contract.contract.feeConfigs(eid)).paused
    }

    async setPaused(eid: EndpointId, paused: boolean): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setPaused', [eid, paused])

        return {
            ...this.createTransaction(data),
            description: `Setting paused for ${formatEid(eid)}: ${paused}`,
        }
    }
}
