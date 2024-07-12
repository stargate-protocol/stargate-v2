import { Configurator, createConfigureMultiple, createConfigureNodes } from '@layerzerolabs/devtools'

import { IRewarder, RewarderOmniGraph, RewarderRewardsOmniGraph } from './types'

export type RewarderConfigurator = Configurator<RewarderOmniGraph, IRewarder>
export type RewarderRewardsConfigurator = Configurator<RewarderRewardsOmniGraph, IRewarder>

export const configureAllocations: RewarderConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    const txs = []

    for (const [rewardToken, expectedAllocations] of Object.entries(config.allocations)) {
        const actualAllocations = await sdk.getAllocationsByRewardToken(rewardToken)

        for (const [stakingToken, expectedAllocation] of Object.entries(expectedAllocations)) {
            if (actualAllocations[stakingToken] !== expectedAllocation) {
                // if any of the allocations are different, just set the whole thing
                txs.push(await sdk.setAllocPoints(rewardToken, expectedAllocations))
                // in that case we can break as we are setting all of them anyway
                break
            }
        }
    }

    return txs
})
export const configureRewards: RewarderRewardsConfigurator = createConfigureNodes(async ({ config }, sdk) => {
    if (config.rewards == null) return []

    // Do not need to get the current reward details as we are setting the reward
    return [
        await sdk.setReward(
            config.rewards.rewardToken,
            config.rewards.amount,
            config.rewards.start,
            config.rewards.duration
        ),
    ]
})

export const configureRewarder: RewarderConfigurator = createConfigureMultiple(configureAllocations)
