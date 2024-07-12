import { ICreditMessaging } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, type OmniAddress, type OmniTransaction, formatEid, ignoreZero } from '@layerzerolabs/devtools'

import { Messaging } from '../messaging'

import type { EndpointId } from '@layerzerolabs/lz-definitions'

// There is only one messaging type for CreditMessaging
export const MSG_TYPE_CREDIT_MESSAGING = 3

export class CreditMessaging extends Messaging implements ICreditMessaging {
    @AsyncRetriable()
    async getPlanner(): Promise<OmniAddress | undefined> {
        const planner = await this.contract.contract.planner()

        return ignoreZero(planner)
    }

    async setPlanner(planner: OmniAddress): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setPlanner', [planner])

        return {
            ...this.createTransaction(data),
            description: `Setting planner to: ${planner}`,
        }
    }

    @AsyncRetriable()
    async getGasLimit(eid: EndpointId): Promise<bigint> {
        const gasLimit = await this.contract.contract.gasLimits(eid)

        return gasLimit.toBigInt()
    }

    async setGasLimit(eid: EndpointId, gasLimit: bigint): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setGasLimit', [eid, gasLimit])

        return {
            ...this.createTransaction(data),
            description: `Setting gas limit for ${formatEid(eid)} to: ${gasLimit}`,
        }
    }
}
