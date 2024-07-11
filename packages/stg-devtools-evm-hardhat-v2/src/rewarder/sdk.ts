import { Allocations, IRewarder, RewardDetails } from '@stargatefinance/stg-devtools-v2'

import { AsyncRetriable, OmniAddress, type OmniTransaction } from '@layerzerolabs/devtools'
import { Ownable } from '@layerzerolabs/ua-devtools-evm'

export class Rewarder extends Ownable implements IRewarder {
    async setReward(token: OmniAddress, amount: bigint, start: number, duration: number): Promise<OmniTransaction> {
        const data = this.contract.contract.interface.encodeFunctionData('setReward', [token, amount, start, duration])

        return {
            ...this.createTransaction(data),
            description: `Increasing rewards for ${token} by ${amount} starting at ${start} distributed over ${duration} seconds`,
        }
    }

    @AsyncRetriable()
    async getAllocationsByRewardToken(rewardToken: OmniAddress): Promise<Allocations> {
        const [tokens, points] = await this.contract.contract.allocPointsByReward(rewardToken)

        const allocations: Allocations = {}
        tokens.forEach((stakingToken: OmniAddress, index: number) => {
            allocations[stakingToken] = points[index]
        })

        return allocations
    }

    @AsyncRetriable()
    async getAllocationsByStakingToken(stakingToken: OmniAddress): Promise<Allocations> {
        const [tokens, points] = await this.contract.contract.allocPointsByStake(stakingToken)

        const allocations: Allocations = {}
        tokens.forEach((rewardToken: OmniAddress, index: number) => {
            allocations[rewardToken] = points[index]
        })

        return allocations
    }

    async setAllocPoints(rewardToken: OmniAddress, allocations: Allocations): Promise<OmniTransaction> {
        const stakingTokens = Object.keys(allocations)
        const points = Object.values(allocations)

        const data = this.contract.contract.interface.encodeFunctionData('setAllocPoints', [
            rewardToken,
            stakingTokens,
            points,
        ])

        return {
            ...this.createTransaction(data),
            description: `Setting allocations for ${rewardToken}`,
        }
    }

    @AsyncRetriable()
    async getRewardDetails(token: OmniAddress): Promise<RewardDetails> {
        const rewardDetails = await this.contract.contract.rewardDetails(token)

        return {
            rewardPerSec: rewardDetails.rewardPerSec.toBigInt(),
            totalAllocPoints: rewardDetails.totalAllocPoints.toBigInt(),
            start: rewardDetails.start,
            end: rewardDetails.end,
            exists: rewardDetails.exists,
        }
    }

    @AsyncRetriable()
    async getRewardTokens(): Promise<OmniAddress[]> {
        const rewardTokens = await this.contract.contract.rewardTokens()

        return rewardTokens
    }
}
