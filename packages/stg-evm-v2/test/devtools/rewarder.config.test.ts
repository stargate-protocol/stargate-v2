import '@nomiclabs/hardhat-ethers'

import { expect } from 'chai'
import hre from 'hardhat'

import rewarderConfig from '../../devtools/config/mainnet/01/rewarder.config'
import { getOneSigAddress } from '../../devtools/config/utils'
import { getAllSupportedChains, getChainsThatSupportRewarder } from '../../devtools/config/utils/utils.config'

import { setupConfigTestEnvironment } from './utils'

describe('rewarder.config', () => {
    setupConfigTestEnvironment(hre)

    it('should generate correct configuration for all chains (use all chains since no CHAINS_LIST is provided)', async () => {
        const supportedChains = getChainsThatSupportRewarder()

        // Get rewarder config
        const config = await rewarderConfig()

        // Check that config is generated with contracts and connections
        expect(config).to.have.property('contracts')
        expect(config).to.have.property('connections')

        // Check that all contracts are included
        expect(config.contracts.length).to.equal(supportedChains.length)

        // Check that each contract has the correct structure
        for (const contract of config.contracts) {
            expect(contract).to.have.property('contract')
            expect(contract).to.have.property('config')
            expect(contract.contract).to.have.property('contractName', 'StargateMultiRewarder')
            expect(contract.config).to.have.property('owner')
            expect(contract.config).to.have.property('allocations')
        }
    })

    it('should filter chains based on CHAINS_LIST environment variable', async () => {
        // Get chains that support rewarder
        const supportedChains = getChainsThatSupportRewarder()
        const selectedChains = [supportedChains[0].name, supportedChains[1].name]

        process.env.CHAINS_LIST = selectedChains.join(',')

        // Get rewarder config
        const config = await rewarderConfig()

        // Check that only contracts from the specified chains are included
        const selectedChainEids = supportedChains
            .filter((chain) => selectedChains.includes(chain.name))
            .map((chain) => chain.eid)

        // Check that all contracts are from the selected chains
        for (const contract of config.contracts) {
            expect(selectedChainEids).to.include(contract.contract.eid)
        }

        // Check that the number of contracts matches the number of selected chains
        expect(config.contracts.length).to.equal(selectedChains.length)
    })

    it('should generate correct allocations configuration for each contract', async () => {
        // Get rewarder config
        const config = await rewarderConfig()

        // Check that each contract has the correct allocations configuration
        for (const contract of config.contracts) {
            expect(contract.config.allocations).to.be.an('object')

            // Check that each allocation has the correct structure
            if (contract.config.allocations) {
                for (const [rewardToken, allocations] of Object.entries(contract.config.allocations)) {
                    expect(rewardToken).to.be.a('string')
                    expect(allocations).to.be.an('object')

                    // Check that each allocation has the correct structure
                    for (const [lpToken, amount] of Object.entries(allocations)) {
                        expect(lpToken).to.be.a('string')
                        expect(amount).to.be.a('number')
                    }
                }
            }
        }
    })

    it('should use the correct safe address for owner', async () => {
        // Get rewarder config
        const config = await rewarderConfig()

        // Check that each contract has the correct safe address
        for (const contract of config.contracts) {
            const oneSigAddress = getOneSigAddress(contract.contract.eid)
            expect(contract.config.owner).to.equal(oneSigAddress)
        }
    })

    it('should throw an error when invalid chains are provided', async () => {
        // Define invalid chains
        process.env.CHAINS_LIST = 'InvalidChain1,InvalidChain2'

        // Check that the error is thrown
        try {
            await rewarderConfig()
            expect.fail('Expected an error to be thrown')
        } catch (error: any) {
            expect(error.message).to.include('Invalid chain: InvalidChain1')
        }
    })

    it('should remove the invalid chains when they are provided and are not supported', async () => {
        // Get chains that do not support rewarder
        const allValidChains = getAllSupportedChains()
        const supportedChains = getChainsThatSupportRewarder()
        const supportedChainNames = supportedChains.map((chain) => chain.name)
        const unsupportedChains = allValidChains.filter((chainName) => !supportedChainNames.includes(chainName))

        process.env.CHAINS_LIST = unsupportedChains.join(',')

        const config = await rewarderConfig()

        // from chains should be empty so will use all chains
        const fromChainEids = supportedChains.map((chain) => chain.eid)
        const toChainEids = supportedChains.map((chain) => chain.eid)

        // check the config has no contracts for the unsupported chains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }
    })
})
