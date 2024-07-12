import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createRewarderFactory, createStakingFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    RewarderOmniGraph,
    RewarderRewardsOmniGraph,
    StakingNodeConfig,
    StakingOmniGraph,
    configureRewarder,
    configureRewards,
    configureStaking,
} from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniAddress, OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Rewarder/configurator', () => {
    const stakingA: OmniAddress = '0x0000000000000000000000000000000000000001'
    const stakingB: OmniAddress = '0x0000000000000000000000000000000000000002'
    const stakingC: OmniAddress = '0x0000000000000000000000000000000000000003'

    // Declaration of variables to be used in the test suite
    let myRewarder: Contract
    let myStaking: Contract
    let owner: SignerWithAddress

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        // Just used as a placeholder
        myStaking = await (await ethers.getContractFactory('StargateStaking')).deploy()

        // Deploying an instance of the Stargate contract and linking it to the mock LZEndpoint
        myRewarder = await (await ethers.getContractFactory('StargateMultiRewarder')).deploy(myStaking.address)

        // set up staking prior to rewarder, as setPool(...) must be called prior to setAllocPoints(...)
        const stakingSdkFactory = createStakingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myStaking.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_SANDBOX,
            address: myStaking.address,
        }
        const graph: StakingOmniGraph = new OmniGraphBuilder<StakingNodeConfig, never>().addNodes({
            point: myPoint,
            config: {
                pools: [
                    {
                        token: stakingA,
                        rewarder: myRewarder.address,
                    },
                    {
                        token: stakingB,
                        rewarder: myRewarder.address,
                    },
                    {
                        token: stakingC,
                        rewarder: myRewarder.address,
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

    it('should configure the contract', async () => {
        const sdkFactory = createRewarderFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myRewarder.attach(address),
        }))
        const rewardA: OmniAddress = '0x0000000000000000000000000000000000000004'
        const config = {
            [rewardA]: {
                [stakingA]: 100,
                [stakingB]: 200,
                [stakingC]: 300,
            },
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myRewarder.address,
        }
        const graph: RewarderOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                allocations: config,
            },
        }).graph as RewarderOmniGraph

        const configTxs = await configureRewarder(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myRewarder.address })

        for (const [rewardToken, allocations] of Object.entries(config)) {
            const actualAllocations = await sdk.getAllocationsByRewardToken(rewardToken)
            for (const [stakingToken, allocation] of Object.entries(actualAllocations)) {
                expect(allocation).to.equal(allocations[stakingToken])
            }
        }
    })

    it('should return no Txs when configuration matches', async () => {
        const sdkFactory = createRewarderFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myRewarder.attach(address),
        }))

        const stakingA: OmniAddress = '0x0000000000000000000000000000000000000001'
        const stakingB: OmniAddress = '0x0000000000000000000000000000000000000002'
        const stakingC: OmniAddress = '0x0000000000000000000000000000000000000003'
        const rewardA: OmniAddress = '0x0000000000000000000000000000000000000004'
        const config = {
            [rewardA]: {
                [stakingA]: 100,
                [stakingB]: 200,
                [stakingC]: 300,
            },
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myRewarder.address,
        }
        const graph: RewarderOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                allocations: config,
            },
        }).graph as RewarderOmniGraph

        const configTxs = await configureRewarder(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myRewarder.address })

        for (const [rewardToken, allocations] of Object.entries(config)) {
            const actualAllocations = await sdk.getAllocationsByRewardToken(rewardToken)
            for (const [stakingToken, allocation] of Object.entries(actualAllocations)) {
                expect(allocation).to.equal(allocations[stakingToken])
            }
        }

        expect(await configureRewarder(graph, sdkFactory)).to.empty
    })

    it('should configure setRewards based of configuration', async () => {
        const sdkFactory = createRewarderFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myRewarder.attach(address),
        }))

        const token = await (await ethers.getContractFactory('ERC20Token')).deploy('TEST', 'TEST', 6)
        await token.mint(owner.address, 12419200000000000000000000n)
        await token.approve(myRewarder.address, 12419200000000000000000000n)

        // Get the current block number
        const currentBlockNumber = await ethers.provider.getBlockNumber()
        // Get the current block
        const currentBlock = await ethers.provider.getBlock(currentBlockNumber)
        // Get the current timestamp
        const currentTimestamp = currentBlock.timestamp

        const config = {
            rewards: {
                rewardToken: token.address,
                amount: BigInt(12419200000000000000000000n),
                start: currentTimestamp + 100,
                duration: 12419200,
            },
        }

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myRewarder.address,
        }
        const graph: RewarderRewardsOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: config,
        }).graph as RewarderRewardsOmniGraph

        const configTxs = await configureRewards(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            const res = await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myRewarder.address })
        const rewardDetails = await sdk.getRewardDetails(token.address)
        expect(rewardDetails.rewardPerSec).to.equal(1000000000000000000n)
        expect(rewardDetails.totalAllocPoints).to.equal(0)
        expect(rewardDetails.start).to.equal(config.rewards.start)
        expect(rewardDetails.end).to.equal(config.rewards.start + config.rewards.duration)
        expect(rewardDetails.exists).to.equal(true)
    })
})
