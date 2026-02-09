import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { OmniSDK } from '@layerzerolabs/devtools-evm'

// OpenZeppelin AccessControl DEFAULT_ADMIN_ROLE = bytes32(0)
export const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'

export class TIP20Token extends OmniSDK {
    // -------- Roles (read from contract to avoid hardcoding) ----------
    @AsyncRetriable()
    async getPauseRole(): Promise<string> {
        return await this.contract.contract.PAUSE_ROLE()
    }
    @AsyncRetriable()
    async getUnpauseRole(): Promise<string> {
        return await this.contract.contract.UNPAUSE_ROLE()
    }
    @AsyncRetriable()
    async getIssuerRole(): Promise<string> {
        return await this.contract.contract.ISSUER_ROLE()
    }
    @AsyncRetriable()
    async getBurnBlockedRole(): Promise<string> {
        return await this.contract.contract.BURN_BLOCKED_ROLE()
    }
    @AsyncRetriable()
    async getDefaultAdminRole(): Promise<string> {
        return DEFAULT_ADMIN_ROLE
    }

    // --------- Role helpers -----------
    @AsyncRetriable()
    async hasRole(account: OmniAddress, role: string): Promise<boolean> {
        return await this.contract.contract.hasRole(account, role)
    }

    @AsyncRetriable()
    async grantRole(roleName: string, role: string, account: OmniAddress): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('grantRole', [role, account])
        return {
            ...this.createTransaction(data),
            description: `Grant role ${roleName} to ${account}`,
        }
    }

    @AsyncRetriable()
    async revokeRole(roleName: string, role: string, account: OmniAddress): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('revokeRole', [role, account])
        return {
            ...this.createTransaction(data),
            description: `Revoke role ${roleName} from ${account}`,
        }
    }

    // --------- Issuer controls ----------

    @AsyncRetriable()
    async setIssuer(account: OmniAddress): Promise<OmniTransaction | undefined> {
        const issuerRole = await this.getIssuerRole()
        const isIssuer = await this.hasRole(account, issuerRole)
        if (isIssuer) return undefined
        return this.grantRole('issuer', issuerRole, account)
    }

    // --------- Admin controls ----------
    @AsyncRetriable()
    async setAdmin(admin: OmniAddress): Promise<OmniTransaction | undefined> {
        const adminRole = await this.getDefaultAdminRole()
        const hasAdminRole = await this.hasRole(admin, adminRole)
        if (hasAdminRole) return undefined
        return this.grantRole('admin', adminRole, admin)
    }
    @AsyncRetriable()
    async renounceAdmin(): Promise<OmniTransaction | undefined> {
        const adminRole = await this.getDefaultAdminRole()
        const caller = await this.contract.contract.signer.getAddress()
        const hasAdminRole = await this.hasRole(caller, adminRole)
        if (!hasAdminRole) return undefined
        const data = this.contract.contract.interface.encodeFunctionData('renounceRole', [adminRole])
        return {
            ...this.createTransaction(data),
            description: `Renounce default admin role`,
        }
    }

    // --------- Pauser controls ----------

    @AsyncRetriable()
    async setPauser(pauser: OmniAddress): Promise<OmniTransaction | undefined> {
        const pauserRole = await this.getPauseRole()
        const hasPauserRole = await this.hasRole(pauser, pauserRole)
        if (hasPauserRole) return undefined

        return this.grantRole('pauser', pauserRole, pauser)
    }
    async setUnpauser(unpauser: OmniAddress): Promise<OmniTransaction | undefined> {
        const unpauserRole = await this.getUnpauseRole()
        const hasUnpauserRole = await this.hasRole(unpauser, unpauserRole)
        if (hasUnpauserRole) return undefined

        return this.grantRole('unpauser', unpauserRole, unpauser)
    }

    // --------- Burn blocked controls ----------
    @AsyncRetriable()
    async setBurnBlocked(burnBlocked: OmniAddress): Promise<OmniTransaction | undefined> {
        const burnBlockedRole = await this.getBurnBlockedRole()
        const hasBurnBlockedRole = await this.hasRole(burnBlocked, burnBlockedRole)
        if (hasBurnBlockedRole) return undefined

        return this.grantRole('burnBlocked', burnBlockedRole, burnBlocked)
    }
}
