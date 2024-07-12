import { ITreasurer } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

export class Treasurer extends Ownable implements ITreasurer {
    @AsyncRetriable()
    async getAdmin(): Promise<OmniAddress> {
        return await this.contract.contract.admin()
    }

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

    async setAsset(asset: OmniAddress, managed: boolean): Promise<OmniTransaction> {
        // The contracts reference these as stargates, but really they are 'assets'
        const data = this.contract.contract.interface.encodeFunctionData('setStargate', [asset, managed])

        return {
            ...this.createTransaction(data),
            description: `Setting the following Asset ${asset}: managed: ${managed}`,
        }
    }
}
