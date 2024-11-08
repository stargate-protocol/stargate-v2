import { StargateType } from '@stargatefinance/stg-definitions-v2'
import { AddressConfig, IAsset } from '@stargatefinance/stg-devtools-v2'

import {
    AsyncRetriable,
    OmniAddress,
    type OmniTransaction,
    formatEid,
    formatOmniPoint,
    ignoreZero,
    isDeepEqual,
} from '@layerzerolabs/devtools'
import { addChecksum, omniContractToPoint } from '@layerzerolabs/devtools-evm'
import { printJson, printRecord } from '@layerzerolabs/io-devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

const UNLIMITED_CREDIT = BigInt('0xffffffffffffffff')
const PAUSED = 3

export class Asset extends Ownable implements IAsset {
    @AsyncRetriable()
    async getAddressConfig(): Promise<AddressConfig> {
        const config = await this.contract.contract.getAddressConfig()

        return {
            feeLib: config.feeLib,
            planner: config.planner,
            treasurer: config.treasurer,
            tokenMessaging: config.tokenMessaging,
            creditMessaging: config.creditMessaging,
            lzToken: config.lzToken,
        }
    }

    async setAddressConfig(config: AddressConfig): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setAddressConfig', [
            {
                feeLib: config.feeLib,
                planner: config.planner,
                treasurer: config.treasurer,
                tokenMessaging: config.tokenMessaging,
                creditMessaging: config.creditMessaging,
                lzToken: config.lzToken,
            },
        ])

        return {
            ...this.createTransaction(data),
            description: `Setting address config for ${formatOmniPoint(omniContractToPoint(this.contract))}`,
            functionName: 'setAddressConfig',
            functionArgs: `config = ${printRecord(config)}`,
        }
    }

    async hasAddressConfig(config: AddressConfig): Promise<boolean> {
        const currentConfig = await this.getAddressConfig()
        const currentSerializedConfig = this.serializeAddressConfig(currentConfig)
        const serializedConfig = this.serializeAddressConfig(config)

        this.logger.debug(`Checking whether Asset Address-configs match`)
        this.logger.debug(`Current config: ${printJson(currentSerializedConfig)}`)
        this.logger.debug(`Incoming config: ${printJson(serializedConfig)}`)

        return isDeepEqual(serializedConfig, currentSerializedConfig)
    }

    @AsyncRetriable()
    async isOFTPath(dstEid: EndpointId): Promise<boolean> {
        const credit = await this.contract.contract.paths(dstEid)

        return credit.toBigInt() === UNLIMITED_CREDIT
    }

    async setOFTPath(dstEid: EndpointId, isOft: boolean): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setOFTPath', [dstEid, isOft])

        return {
            ...this.createTransaction(data),
            description: `Setting isOFT path for ${this.label} on ${formatEid(dstEid)} to ${isOft}`,
            functionName: 'setOFTPath',
            functionArgs: `dstEid = ${formatEid(dstEid)} \nisOft = ${isOft}`,
        }
    }

    @AsyncRetriable()
    async getToken(): Promise<OmniAddress | undefined> {
        return ignoreZero(await this.contract.contract.token())
    }
    @AsyncRetriable()
    async getStargateType(): Promise<StargateType> {
        this.logger.debug(`Getting Stargate type`)

        const stargateType = await this.contract.contract.stargateType()
        this.logger.debug(`Got Stargate type ${stargateType}`)

        // For OFTs is clear
        if (stargateType === 1) {
            this.logger.debug(`Assuming Stargate type ${StargateType.Oft}`)
            return StargateType.Oft
        }

        // For pools we need to check whether the token address is zero
        const tokenAddress = await this.getToken()
        if (tokenAddress == null) {
            this.logger.debug(`Got zero token address, assuming Stargate type ${StargateType.Native}`)
            return StargateType.Native
        }

        this.logger.debug(`Got non-zero token address, assuming Stargate type ${StargateType.Pool}`)
        return StargateType.Pool
    }

    @AsyncRetriable()
    async getLPToken(): Promise<OmniAddress | undefined> {
        // We want to return undefined if there is no lpToken function defined on the asset as opposed to throwing
        // since throwing would trigger the async retriable
        if (this.contract.contract.interface.functions['lpToken()'] == null) {
            return (
                this.logger.warn(`Cannot get LP token address for ${this.label}: lpToken function is not supported`),
                undefined
            )
        }

        return ignoreZero(await this.contract.contract.lpToken())
    }

    @AsyncRetriable()
    async isPaused(): Promise<boolean> {
        const paused = await this.contract.contract.status()

        return paused === PAUSED
    }

    async setPaused(paused: boolean): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setPause', [paused])

        return {
            ...this.createTransaction(data),
            description: `Setting paused status for ${this.label} to ${paused}`,
            functionName: 'setPaused',
            functionArgs: `paused = ${paused}`,
        }
    }

    protected serializeAddressConfig({
        feeLib,
        planner,
        treasurer,
        tokenMessaging,
        creditMessaging,
        lzToken,
    }: AddressConfig): AddressConfig {
        return {
            feeLib: addChecksum(feeLib),
            planner: addChecksum(planner),
            treasurer: addChecksum(treasurer),
            tokenMessaging: addChecksum(tokenMessaging),
            creditMessaging: addChecksum(creditMessaging),
            lzToken: addChecksum(lzToken),
        }
    }
}
