import { IBlacklistable } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, type OmniTransaction } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

import { BlacklistableMixin } from './mixin'

export class Blacklistable extends OmniSDK implements IBlacklistable {
    @AsyncRetriable()
    async getBlacklister(): Promise<string> {
        return BlacklistableMixin.getBlacklister.call(this)
    }
    async setBlacklister(blacklister: string): Promise<OmniTransaction> {
        return BlacklistableMixin.setBlacklister.call(this, blacklister)
    }
    @AsyncRetriable()
    async isBlacklisted(address: string): Promise<boolean> {
        return BlacklistableMixin.isBlacklisted.call(this, address)
    }
    async setBlacklisted(address: string, blacklisted: boolean): Promise<OmniTransaction> {
        return BlacklistableMixin.setBlacklisted.call(this, address, blacklisted)
    }
}
