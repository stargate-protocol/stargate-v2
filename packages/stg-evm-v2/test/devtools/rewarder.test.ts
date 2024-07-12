import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Rewarder, createStakingFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { Allocations, StakingNodeConfig, StakingOmniGraph, configureStaking } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

class StakingEdgeConfig {}

describe('Rewarder/sdk', () => {
    // Declaration of variables to be used in the test suite
    let myStaking: Contract
    let owner: SignerWithAddress
    let stakingToken: Contract
    let rewardToken: Contract
    let rewarder: Contract
    let sdk: Rewarder

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        myStaking = await (await ethers.getContractFactory('StargateStaking')).deploy()

        stakingToken = await (await ethers.getContractFactory('ERC20Token')).deploy('Mock', 'MCK', 6)

        rewardToken = await (await ethers.getContractFactory('ERC20Token')).deploy('Mock', 'MCK', 6)

        rewarder = await (await ethers.getContractFactory('StargateMultiRewarder')).deploy(myStaking.address)

        sdk = new Rewarder({ eid: EndpointId.ETHEREUM_SANDBOX, contract: rewarder })

        // set up staking prior to rewarder, as setPool(...) must be called prior to setAllocPoints(...)
        const stakingSdkFactory = createStakingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myStaking.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_SANDBOX,
            address: myStaking.address,
        }
        const graph: StakingOmniGraph = new OmniGraphBuilder<StakingNodeConfig, StakingEdgeConfig>().addNodes({
            point: myPoint,
            config: {
                pools: [
                    {
                        token: stakingToken.address,
                        rewarder: rewarder.address,
                    },
                ],
            },
        }).graph
        const configTxs = await configureStaking(graph, stakingSdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }
    })

    describe('setReward', () => {
        it('should set the reward', async () => {
            await rewardToken.mint(owner.address, 1000n)
            await rewardToken.approve(rewarder.address, 1000n)

            const latestBlock = await ethers.provider.getBlock('latest')
            const tx = await sdk.setReward(rewardToken.address, 200n, latestBlock.timestamp + 5, 100)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })

            expect((await sdk.getRewardDetails(rewardToken.address)).rewardPerSec).to.equal(2)

            expect((await sdk.getRewardTokens()).length).to.equal(1)
            expect((await sdk.getRewardTokens())[0]).to.equal(rewardToken.address)
        })
    })

    describe('setAllocPoints', () => {
        it('should set the alloc points', async () => {
            const allocations: Allocations = {
                [stakingToken.address]: 100,
            }

            const tx = await sdk.setAllocPoints(rewardToken.address, allocations)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            let actualAllocations = await sdk.getAllocationsByRewardToken(rewardToken.address)

            expect(Object.keys(actualAllocations).length).to.equal(1)
            expect(actualAllocations[stakingToken.address]).to.equal(100n)

            actualAllocations = await sdk.getAllocationsByStakingToken(stakingToken.address)

            expect(Object.keys(actualAllocations).length).to.equal(1)
            expect(actualAllocations[rewardToken.address]).to.equal(100n)
        })
    })
})
