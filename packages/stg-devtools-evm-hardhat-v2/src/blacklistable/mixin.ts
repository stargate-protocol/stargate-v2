import { IBlacklistable } from '@stargatefinance/stg-devtools-v2'

import { OmniAddress, OmniTransaction, mapError } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

export const BlacklistableMixin: IBlacklistable = {
    async getBlacklister(this: OmniSDK): Promise<OmniAddress> {
        this.logger.debug(`Getting blacklister`)

        const blacklister = await mapError(
            async () => this.contract.contract.blacklister(),
            (error) => new Error(`Failed to get blacklister for ${this.label}: ${error}`)
        )

        return this.logger.debug(`Got blacklister: ${blacklister}`), blacklister
    },
    async setBlacklister(this: OmniSDK, blacklister: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Setting blacklister for ${this.label} to address ${blacklister}`)

        const data = this.contract.contract.interface.encodeFunctionData('updateBlacklister', [blacklister])

        return {
            ...this.createTransaction(data),
            description: `Setting blacklister to address ${blacklister}`,
            functionName: 'setBlacklister',
            functionArgs: `blacklister = ${blacklister}`,
        }
    },
    async isBlacklisted(this: OmniSDK, address: OmniAddress): Promise<boolean> {
        this.logger.debug(`Getting blacklisted state for ${address}`)

        const blacklisted = await mapError(
            async () => this.contract.contract.isBlacklisted(address),
            (error) => new Error(`Failed to get blacklisted state for ${this.label}: ${error}`)
        )

        return this.logger.debug(`Got blacklisted: ${blacklisted}`), blacklisted
    },
    async setBlacklisted(this: OmniSDK, address: OmniAddress, blacklisted: boolean): Promise<OmniTransaction> {
        this.logger.debug(`Setting blacklisted for ${this.label} for ${address} to ${blacklisted}`)

        const data = this.contract.contract.interface.encodeFunctionData(blacklisted ? 'blacklist' : 'unBlacklist', [
            address,
        ])

        return {
            ...this.createTransaction(data),
            description: `Setting ${address} blacklist status to ${blacklisted}`,
            functionName: 'setBlacklisted',
            functionArgs: `address = ${address}\nblacklisted = ${blacklisted}`, // TODO confirm this pattern with Jan before proceeding to make this change in all files
        }
    },
}
