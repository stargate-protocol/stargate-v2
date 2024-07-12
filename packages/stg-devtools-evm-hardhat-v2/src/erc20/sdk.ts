import { IERC20, NameSchema, SymbolSchema } from '@stargatefinance/stg-devtools-v2'

import {
    AsyncRetriable,
    type OmniAddress,
    type OmniTransaction,
    UIntNumberSchema,
    tapError,
} from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

export class ERC20 extends Ownable implements IERC20 {
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
    async getName(): Promise<string> {
        this.logger.verbose(`Getting token name`)

        const name = await tapError(
            () => this.contract.contract.name(),
            (error) => (this.logger.error(`Failed to get token name: ${error}`), undefined)
        )

        return NameSchema.parse(name)
    }

    @AsyncRetriable()
    async getSymbol(): Promise<string> {
        this.logger.verbose(`Getting token symbol`)

        const symbol = await tapError(
            () => this.contract.contract.symbol(),
            (error) => (this.logger.error(`Failed to get token symbol: ${error}`), undefined)
        )

        return SymbolSchema.parse(symbol)
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
