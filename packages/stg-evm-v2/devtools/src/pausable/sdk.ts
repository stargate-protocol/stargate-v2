import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

import { PausableMixin } from './mixin'

import type { IPausable } from './types'

export class Pausable extends OmniSDK implements IPausable {
    @AsyncRetriable()
    async getPauser(): Promise<OmniAddress> {
        return PausableMixin.getPauser.call(this)
    }

    async setPauser(pauser: OmniAddress): Promise<OmniTransaction> {
        return PausableMixin.setPauser.call(this, pauser)
    }

    @AsyncRetriable()
    async isPaused(): Promise<boolean> {
        return PausableMixin.isPaused.call(this)
    }

    async setPaused(paused: boolean): Promise<OmniTransaction> {
        return PausableMixin.setPaused.call(this, paused)
    }
}
