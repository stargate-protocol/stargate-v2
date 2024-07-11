import { IMintable } from '@stargatefinance/stg-devtools-v2'

import { OmniAddress, OmniTransaction, mapError } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

export const MintableMixin: IMintable = {
    async isMinter(this: OmniSDK, minter: OmniAddress): Promise<boolean> {
        this.logger.debug(`Check whether ${minter} is a minter for ${this.label}`)

        const isMinterStatus = await mapError(
            async () => this.contract.contract.minters(minter),
            (error) => new Error(`Failed to get minter status for ${this.label}: ${error}`)
        )

        return this.logger.debug(`Got minter: ${isMinterStatus}`), isMinterStatus
    },
    async addMinter(this: OmniSDK, minter: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Adding minter for ${this.label} : ${minter}`)

        const data = this.contract.contract.interface.encodeFunctionData('addMinter', [minter])

        return {
            ...this.createTransaction(data),
            description: `Adding minter: ${minter}`,
        }
    },
    async removeMinter(this: OmniSDK, minter: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Removing minter for ${this.label} : ${minter}`)

        const data = this.contract.contract.interface.encodeFunctionData('removeMinter', [minter])

        return {
            ...this.createTransaction(data),
            description: `Removing minter: ${minter}`,
        }
    },
}
