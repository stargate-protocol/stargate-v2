import { IUSDC } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, OmniAddress, type OmniTransaction, UIntBigIntSchema } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'
import { OwnableMixin } from '@layerzerolabs/ua-devtools-evm'

import { BlacklistableMixin } from '../blacklistable'
import { PausableMixin } from '../pausable'
import { RescuableMixin } from '../rescuable'

export class USDC extends OmniSDK implements IUSDC {
    @AsyncRetriable()
    async getOwner(): Promise<string | undefined> {
        return OwnableMixin.getOwner.call(this)
    }
    @AsyncRetriable()
    async hasOwner(address: string): Promise<boolean> {
        return OwnableMixin.hasOwner.call(this, address)
    }
    async setOwner(address: string): Promise<OmniTransaction> {
        return OwnableMixin.setOwner.call(this, address)
    }
    @AsyncRetriable()
    async getPauser(): Promise<string> {
        return PausableMixin.getPauser.call(this)
    }
    async setPauser(pauser: string): Promise<OmniTransaction> {
        return PausableMixin.setPauser.call(this, pauser)
    }
    @AsyncRetriable()
    async isPaused(): Promise<boolean> {
        return PausableMixin.isPaused.call(this)
    }
    async setPaused(paused: boolean): Promise<OmniTransaction> {
        return PausableMixin.setPaused.call(this, paused)
    }
    @AsyncRetriable()
    async getRescuer(): Promise<string> {
        return RescuableMixin.getRescuer.call(this)
    }
    async setRescuer(rescuer: string): Promise<OmniTransaction> {
        return RescuableMixin.setRescuer.call(this, rescuer)
    }
    async rescueERC20(tokenContract: string, to: string, amount: bigint): Promise<OmniTransaction> {
        return RescuableMixin.rescueERC20.call(this, tokenContract, to, amount)
    }
    @AsyncRetriable()
    async getBlacklister(): Promise<string> {
        return BlacklistableMixin.getBlacklister.call(this)
    }
    async setBlacklister(blacklister: string): Promise<OmniTransaction> {
        return BlacklistableMixin.setBlacklister.call(this, blacklister)
    }
    @AsyncRetriable()
    async isBlacklisted(address: string): Promise<boolean> {
        return BlacklistableMixin.isBlacklisted.call(this, address)
    }
    async setBlacklisted(address: string, blacklisted: boolean): Promise<OmniTransaction> {
        return BlacklistableMixin.setBlacklisted.call(this, address, blacklisted)
    }
    @AsyncRetriable()
    async isMinter(minter: OmniAddress): Promise<boolean> {
        this.logger.debug(`Check whether ${minter} is a minter for ${this.label}`)

        return await this.contract.contract.isMinter(minter)
    }
    @AsyncRetriable()
    async getMinterAllowance(minter: OmniAddress): Promise<bigint> {
        this.logger.debug(`Getting the minter allowance of ${minter} for ${this.label}`)

        return UIntBigIntSchema.parse(await this.contract.contract.minterAllowance(minter))
    }
    async configureMinter(minter: OmniAddress, allowance: bigint): Promise<OmniTransaction> {
        this.logger.debug(`Configuring minter for ${this.label} : ${minter} <${allowance}>`)

        const data = this.contract.contract.interface.encodeFunctionData('configureMinter', [minter, allowance])

        return {
            ...this.createTransaction(data),
            description: `Configuring minter: ${minter} to ${allowance} allowance`,
        }
    }
    async removeMinter(minter: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Removing minter for ${this.label} : ${minter}`)

        const data = this.contract.contract.interface.encodeFunctionData('removeMinter', [minter])

        return {
            ...this.createTransaction(data),
            description: `Removing minter: ${minter}`,
        }
    }
    @AsyncRetriable()
    async getMasterMinter(): Promise<OmniAddress> {
        this.logger.debug(`Getting the master minter for ${this.label}`)

        return await this.contract.contract.masterMinter()
    }
    async setMasterMinter(masterMinter: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Setting master minter for ${this.label} : ${masterMinter}`)

        const data = this.contract.contract.interface.encodeFunctionData('updateMasterMinter', [masterMinter])

        return {
            ...this.createTransaction(data),
            description: `Setting master minter: ${masterMinter}`,
        }
    }
    @AsyncRetriable()
    async getAdmin(): Promise<OmniAddress> {
        this.logger.debug(`Getting the admin for ${this.label}`)
        const admin = await this.contract.contract.admin()

        return this.logger.debug(`Got admin: ${admin}`), admin
    }
    async setAdmin(admin: OmniAddress): Promise<OmniTransaction> {
        this.logger.debug(`Setting admin for ${this.label} : ${admin}`)

        const data = this.contract.contract.interface.encodeFunctionData('changeAdmin', [admin])

        return {
            ...this.createTransaction(data),
            description: `Setting admin: ${admin}`,
        }
    }
}
