import { IPausable } from '@stargatefinance/stg-devtools-v2'

import { OmniAddress, OmniTransaction, mapError } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

export const PausableMixin: IPausable = {
    async getPauser(this: OmniSDK): Promise<OmniAddress> {
        this.logger.debug(`Getting pauser`)

        const pauser = await mapError(
            async () => this.contract.contract.pauser(),
            (error) => new Error(`Failed to get pauser for ${this.label}: ${error}`)
        )

        return this.logger.debug(`Got pauser: ${pauser}`), pauser
    },
    async setPauser(this: OmniSDK, pauser: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Setting pauser for ${this.label} to address ${pauser}`)

        const data = this.contract.contract.interface.encodeFunctionData('updatePauser', [pauser])

        return {
            ...this.createTransaction(data),
            description: `Setting pauser to address ${pauser}`,
        }
    },
    async isPaused(this: OmniSDK): Promise<boolean> {
        this.logger.debug(`Getting paused state`)

        const paused = await mapError(
            async () => this.contract.contract.paused(),
            (error) => new Error(`Failed to get paused state for ${this.label}: ${error}`)
        )

        return this.logger.debug(`Got paused: ${paused}`), paused
    },
    async setPaused(this: OmniSDK, paused: boolean): Promise<OmniTransaction> {
        this.logger.debug(`Setting paused for ${this.label} to ${paused}`)

        const data = this.contract.contract.interface.encodeFunctionData(paused ? 'pause' : 'unpause')

        return {
            ...this.createTransaction(data),
            description: `Setting paused to ${paused}`,
        }
    },
}
