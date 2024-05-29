import { AsyncRetriable, type OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

import { MintableMixin } from './mixin'

import type { IMintable } from './types'

export class Mintable extends Ownable implements IMintable {
    @AsyncRetriable()
    async isMinter(minter: OmniAddress): Promise<boolean> {
        return MintableMixin.isMinter.call(this, minter)
    }
    async addMinter(minter: OmniAddress): Promise<OmniTransaction> {
        return MintableMixin.addMinter.call(this, minter)
    }
    async removeMinter(minter: OmniAddress): Promise<OmniTransaction> {
        return MintableMixin.removeMinter.call(this, minter)
    }
}
