import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { createStakingFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { StakingNodeConfig, StakingOmniGraph, configureStaking } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('Staking/configurator', () => {
    // Declaration of variables to be used in the test suite
    let myStaking: Contract
    let owner: SignerWithAddress
    let token: Contract
    let rewarder: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[owner] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        myStaking = await (await ethers.getContractFactory('StargateStaking')).deploy()

        token = await (await ethers.getContractFactory('ERC20Token')).deploy('Mock', 'MCK', 6)

        rewarder = await (await ethers.getContractFactory('StargateMultiRewarder')).deploy(myStaking.address)
    })

    it('should configure the contract', async () => {
        const sdkFactory = createStakingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myStaking.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_SANDBOX,
            address: myStaking.address,
        }
        const graph: StakingOmniGraph = new OmniGraphBuilder<StakingNodeConfig, unknown>().addNodes({
            point: myPoint,
            config: {
                pools: [
                    {
                        token: token.address,
                        rewarder: rewarder.address,
                    },
                ],
            },
        }).graph

        const configTxs = await configureStaking(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_SANDBOX, address: myStaking.address })
        expect(await sdk.getPool(token.address)).to.equal(rewarder.address)
    })

    it('should return no Txs if configuration matches', async () => {
        const sdkFactory = createStakingFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myStaking.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_SANDBOX,
            address: myStaking.address,
        }
        const graph: StakingOmniGraph = new OmniGraphBuilder<StakingNodeConfig, unknown>().addNodes({
            point: myPoint,
            config: {
                pools: [
                    {
                        token: token.address,
                        rewarder: rewarder.address,
                    },
                ],
            },
        }).graph

        const configTxs = await configureStaking(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureStaking(graph, sdkFactory)).to.be.empty
    })
})
