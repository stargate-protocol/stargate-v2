import { IOFTWrapper } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { BigNumberishBigIntSchema } from '@layerzerolabs/devtools-evm'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

export class OFTWrapper extends Ownable implements IOFTWrapper {
    @AsyncRetriable()
    async getDefaultBps(): Promise<bigint> {
        const bps = await this.contract.contract.defaultBps()

        return BigNumberishBigIntSchema.parse(bps)
    }

    @AsyncRetriable()
    async getOFTBps(token: string): Promise<bigint> {
        const bps = await this.contract.contract.oftBps(token)

        return BigNumberishBigIntSchema.parse(bps)
    }

    async setDefaultBps(bps: bigint): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setDefaultBps', [bps])

        return {
            ...this.createTransaction(data),
            description: `Setting default BPS for to ${bps}`,
        }
    }

    async setOFTBps(token: OmniAddress, bps: bigint): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setOFTBps', [token, bps])

        return {
            ...this.createTransaction(data),
            description: `Setting default BPS for to ${bps}`,
        }
    }
}
