import { ICreditMessaging } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, type OmniAddress, type OmniTransaction, formatEid, ignoreZero } from '@layerzerolabs/devtools'
import { OmniContract } from '@layerzerolabs/devtools-evm'
import { Logger } from '@layerzerolabs/io-devtools'

import { Messaging } from '../messaging'

import type { EndpointId } from '@layerzerolabs/lz-definitions'

// There is only one messaging type for CreditMessaging
export const MSG_TYPE_CREDIT_MESSAGING = 3

export class CreditMessaging extends Messaging implements ICreditMessaging {
    constructor(
        contract: OmniContract,
        public readonly contractName = 'CreditMessaging',
        logger?: Logger
    ) {
        super(contract, logger)
    }

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
            metadata: {
                contractName: this.contractName,
                functionName: 'setPlanner',
                functionArgs: `planner = ${planner}`,
            },
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
            metadata: {
                contractName: this.contractName,
                functionName: 'setGasLimit',
                functionArgs: `eid = ${eid} \n gasLimit = ${gasLimit}`,
            },
        }
    }
}
