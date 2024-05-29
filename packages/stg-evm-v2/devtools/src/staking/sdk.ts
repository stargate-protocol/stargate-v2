import { AsyncRetriable, OmniAddress, type OmniTransaction, ignoreZero } from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

import type { IStaking } from './types'

export class Staking extends Ownable implements IStaking {
    @AsyncRetriable()
    async getPool(token: OmniAddress): Promise<OmniAddress | undefined> {
        const rewarder = await this.contract.contract.rewarder(token)

        return ignoreZero(rewarder)
    }

    async setPool(token: OmniAddress, rewarder: OmniAddress): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setPool', [token, rewarder])

        return {
            ...this.createTransaction(data),
            description: `Setting pool for ${token} to: ${rewarder}`,
        }
    }
}
