import { IRescuable } from '@stargatefinance/stg-devtools-v2'

import { OmniAddress, OmniTransaction, mapError } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

export const RescuableMixin: IRescuable = {
    async getRescuer(this: OmniSDK): Promise<OmniAddress> {
        this.logger.debug(`Getting rescuer`)

        const rescuer = await mapError(
            async () => this.contract.contract.rescuer(),
            (error) => new Error(`Failed to get rescuer for ${this.label}: ${error}`)
        )

        return this.logger.debug(`Got rescuer: ${rescuer}`), rescuer
    },
    async setRescuer(this: OmniSDK, rescuer: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Setting rescuer for ${this.label} to address ${rescuer}`)

        const data = this.contract.contract.interface.encodeFunctionData('updateRescuer', [rescuer])

        return {
            ...this.createTransaction(data),
            description: `Setting rescuer to address ${rescuer}`,
        }
    },
    async rescueERC20(this: OmniSDK, tokenContract: string, to: string, amount: bigint): Promise<OmniTransaction> {
        this.logger.debug(`Rescuing ${amount} of ${tokenContract} through ${this.label} into address ${to}`)

        const data = this.contract.contract.interface.encodeFunctionData('rescueERC20', [tokenContract, to, amount])

        return {
            ...this.createTransaction(data),
            description: `Rescuing ${amount} from ${this.label} to: ${to}`,
        }
    },
}
