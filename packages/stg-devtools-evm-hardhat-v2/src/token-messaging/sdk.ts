import { Fares, ITokenMessaging, TokenMessagingGasLimits } from '@stargatefinance/stg-devtools-v2'

import {
    AsyncRetriable,
    Bytes32,
    type OmniAddress,
    type OmniTransaction,
    UIntNumberSchema,
    formatEid,
    ignoreZero,
} from '@layerzerolabs/devtools'

import { Messaging } from '../messaging'

import type { EndpointId } from '@layerzerolabs/lz-definitions'

export const MSG_TYPE_TAXI = 1
export const MSG_TYPE_BUS = 2

export class TokenMessaging extends Messaging implements ITokenMessaging {
    @AsyncRetriable()
    async getQueueCapacity(): Promise<bigint> {
        const queueCapacity = await this.contract.contract.queueCapacity()

        return BigInt(queueCapacity)
    }

    @AsyncRetriable()
    async getPlanner(): Promise<OmniAddress | undefined> {
        const planner = await this.contract.contract.planner()

        return ignoreZero(planner)
    }

    async setPlanner(planner: OmniAddress): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setPlanner', [planner])

        return {
            ...this.createTransaction(data),
            description: `Setting planner to: ${planner}`,
        }
    }

    @AsyncRetriable()
    async getLastTickedOffset(dstEid: EndpointId): Promise<number> {
        const queue = await this.contract.contract.busQueues(dstEid)

        return queue.tailTicketOffset
    }

    @AsyncRetriable()
    async getPassengerHash(dstEid: EndpointId, index: bigint): Promise<Bytes32 | undefined> {
        const hash = await this.contract.contract.getPassengerHash(dstEid, index)

        return ignoreZero(hash)
    }

    async initializeBusQueueStorage(
        dstEids: EndpointId[],
        startSlot: bigint,
        endSlot: bigint
    ): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('initializeBusQueueStorage', [
            dstEids,
            startSlot,
            endSlot,
        ])

        return {
            ...this.createTransaction(data),
            description: `Initializing bus storage for these endpoints: ${dstEids}`,
        }
    }

    @AsyncRetriable()
    async getMaxPassengers(dstEid: EndpointId): Promise<number> {
        const queue = await this.contract.contract.busQueues(dstEid)

        return UIntNumberSchema.parse(queue.maxNumPassengers)
    }

    async setMaxPassengers(dstEid: EndpointId, maxPassengers: number): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setMaxNumPassengers', [dstEid, maxPassengers])

        return {
            ...this.createTransaction(data),
            description: `Setting max passengers to: ${maxPassengers} for ${formatEid(dstEid)}`,
        }
    }

    @AsyncRetriable()
    async getFares(dstEid: EndpointId): Promise<Fares> {
        const queue = await this.contract.contract.busQueues(dstEid)

        return {
            busFare: queue.busFare.toBigInt(),
            busAndNativeDropFare: queue.busAndNativeDropFare.toBigInt(),
        }
    }

    async setFares(dstEid: EndpointId, fares: Fares): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setFares', [
            dstEid,
            fares.busFare,
            fares.busAndNativeDropFare,
        ])

        return {
            ...this.createTransaction(data),
            description: `Setting fares on ${formatEid(dstEid)} to: ${fares}`,
        }
    }

    @AsyncRetriable()
    async getGasLimit(dstEid: EndpointId): Promise<TokenMessagingGasLimits> {
        const gasLimit = await this.contract.contract.gasLimits(dstEid)

        return {
            gasLimit: gasLimit.gasLimit.toBigInt(),
            nativeDropGasLimit: gasLimit.nativeDropGasLimit.toBigInt(),
        }
    }

    async setGasLimit(dstEid: EndpointId, gasLimit: TokenMessagingGasLimits): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setGasLimit', [
            dstEid,
            gasLimit.gasLimit,
            gasLimit.nativeDropGasLimit,
        ])

        return {
            ...this.createTransaction(data),
            description: `Setting gas limit for ${formatEid(dstEid)}: gasLimit: ${gasLimit}`,
        }
    }

    @AsyncRetriable()
    async getNativeDropAmount(dstEid: EndpointId): Promise<bigint> {
        const nativeDropAmount = await this.contract.contract.nativeDropAmounts(dstEid)

        return nativeDropAmount.toBigInt()
    }

    async setNativeDropAmount(dstEid: EndpointId, nativeDropAmount: bigint): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setNativeDropAmount', [
            dstEid,
            nativeDropAmount,
        ])

        return {
            ...this.createTransaction(data),
            description: `Setting native drop amount on ${formatEid(dstEid)} to: ${nativeDropAmount}`,
        }
    }
}
