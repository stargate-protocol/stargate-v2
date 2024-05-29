import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

import { RescuableMixin } from './mixin'

import type { IRescuable } from './types'

export class Rescuable extends OmniSDK implements IRescuable {
    @AsyncRetriable()
    async getRescuer(): Promise<OmniAddress> {
        return RescuableMixin.getRescuer.call(this)
    }

    async setRescuer(rescuer: OmniAddress): Promise<OmniTransaction> {
        return RescuableMixin.setRescuer.call(this, rescuer)
    }

    async rescueERC20(tokenContract: OmniAddress, to: OmniAddress, amount: bigint): Promise<OmniTransaction> {
        return RescuableMixin.rescueERC20.call(this, tokenContract, to, amount)
    }
}
