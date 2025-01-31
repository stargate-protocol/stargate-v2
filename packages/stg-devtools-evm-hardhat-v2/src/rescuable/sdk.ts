import { IRescuable } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

import { RescuableMixin } from './mixin'

export class Rescuable extends OmniSDK implements IRescuable {
    @AsyncRetriable()
    async getRescuer(): Promise<OmniAddress> {
        return RescuableMixin.getRescuer.call(this)
    }

    @AsyncRetriable()
    async setRescuer(rescuer: OmniAddress): Promise<OmniTransaction> {
        return RescuableMixin.setRescuer.call(this, rescuer)
    }

    @AsyncRetriable()
    async rescueERC20(tokenContract: OmniAddress, to: OmniAddress, amount: bigint): Promise<OmniTransaction> {
        return RescuableMixin.rescueERC20.call(this, tokenContract, to, amount)
    }
}
