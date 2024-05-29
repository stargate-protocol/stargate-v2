import { OmniAddress, OmniTransaction } from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

import { IPool } from './types'

export class Pool extends Ownable implements IPool {
    async deposit(receiver: OmniAddress, amount: bigint): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('deposit', [receiver, amount])

        return {
            ...this.createTransaction(data),
            description: `Depositing ${amount} tokens for ${receiver}`,
        }
    }
}
