import { ITreasurer } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

export class Treasurer extends Ownable implements ITreasurer {
    @AsyncRetriable()
    async getAdmin(): Promise<OmniAddress> {
        return await this.contract.contract.admin()
    }

    @AsyncRetriable()
    async setAdmin(admin: OmniAddress): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setAdmin', [admin])

        return {
            ...this.createTransaction(data),
            description: `Setting admin for treasurer to: ${admin}`,
        }
    }

    @AsyncRetriable()
    async getAsset(asset: OmniAddress): Promise<boolean> {
        return await this.contract.contract.stargates(asset)
    }

    @AsyncRetriable()
    async setAsset(asset: OmniAddress, managed: boolean): Promise<OmniTransaction> {
        // The contracts reference these as stargates, but really they are 'assets'
        const data = this.contract.contract.interface.encodeFunctionData('setStargate', [asset, managed])

        return {
            ...this.createTransaction(data),
            description: `Setting the following Asset ${asset}: managed: ${managed}`,
        }
    }

    @AsyncRetriable()
    async withdrawTreasuryFee(stargate: OmniAddress, amountSD: bigint): Promise<OmniTransaction> {
        const max = 0xffffffffffffffffn
        if (amountSD < 0n || amountSD > max) {
            throw new Error(`withdrawTreasuryFee: amountSD must be uint64, got ${amountSD}`)
        }
        const data = this.contract.contract.interface.encodeFunctionData('withdrawTreasuryFee', [
            stargate,
            amountSD.toString(),
        ])
        return {
            ...this.createTransaction(data),
            description: `Withdraw treasury fee from ${stargate}, amountSD ${amountSD}`,
        }
    }

    @AsyncRetriable()
    async transferToken(token: OmniAddress, to: OmniAddress, amount: bigint): Promise<OmniTransaction> {
        const maxUint256 = (1n << 256n) - 1n
        if (amount < 0n || amount > maxUint256) {
            throw new Error(`transferToken: amount must be uint256, got ${amount}`)
        }
        const data = this.contract.contract.interface.encodeFunctionData('transfer', [token, to, amount.toString()])
        return {
            ...this.createTransaction(data),
            description: `Treasurer transfer token ${token} -> ${to}, amount ${amount}`,
        }
    }
}
