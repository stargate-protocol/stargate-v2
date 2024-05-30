import {
    AsyncRetriable,
    type OmniAddress,
    type OmniTransaction,
    UIntNumberSchema,
    tapError,
} from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

import type { IERC20 } from './types'

export class ERC20 extends Ownable implements IERC20 {
    @AsyncRetriable()
    async symbol(): Promise<string> {
        const symbol = this.contract.contract.symbol()

        return symbol
    }

    @AsyncRetriable()
    async name(): Promise<string> {
        const name = this.contract.contract.name()

        return name
    }

    async approve(spender: OmniAddress, amount: bigint): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('approve', [spender, amount])

        return {
            ...this.createTransaction(data),
            description: `Approving ${spender} to spend ${amount} tokens`,
        }
    }

    @AsyncRetriable()
    async decimals(): Promise<number> {
        this.logger.verbose(`Getting token decimals`)

        const decimals = await tapError(
            () => this.contract.contract.decimals(),
            (error) => (this.logger.error(`Failed to get token decimals: ${error}`), undefined)
        )

        return UIntNumberSchema.parse(decimals)
    }

    @AsyncRetriable()
    async getAllowance(owner: OmniAddress, spender: OmniAddress): Promise<bigint> {
        const allowance = await this.contract.contract.allowance(owner, spender)

        return allowance.toBigInt()
    }

    async mint(account: OmniAddress, amount: bigint): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('mint', [account, amount])

        return {
            ...this.createTransaction(data),
            description: `Minting ${amount} tokens to ${account}`,
        }
    }
}
