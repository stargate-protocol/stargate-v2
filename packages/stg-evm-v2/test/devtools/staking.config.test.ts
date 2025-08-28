import '@nomiclabs/hardhat-ethers'

import { expect } from 'chai'
import hre from 'hardhat'

import stakingConfig from '../../devtools/config/mainnet/01/staking.config'
import { getSafeAddress } from '../../devtools/config/utils'
import { getAllSupportedChains, getChainsThatSupportStaking } from '../../devtools/config/utils/utils.config'

import { setupConfigTestEnvironment } from './utils'

describe('staking.config', () => {
    setupConfigTestEnvironment(hre)

    it('should generate correct configuration for all chains (use all chains since no CHAINS_LIST is provided)', async () => {
        const supportedChains = getChainsThatSupportStaking()

        // Get staking config
        const config = await stakingConfig()

        // Check that config is generated with contracts and connections
        expect(config).to.have.property('contracts')
        expect(config).to.have.property('connections')

        // Check that all contracts are included
        expect(config.contracts.length).to.equal(supportedChains.length)

        // Check that each contract has the correct structure
        for (const contract of config.contracts) {
            expect(contract).to.have.property('contract')
            expect(contract).to.have.property('config')
            expect(contract.contract).to.have.property('contractName', 'StargateStaking')
            expect(contract.config).to.have.property('owner')
            expect(contract.config).to.have.property('pools')

            // Check that each pool has the correct structure
            for (const pool of contract.config.pools) {
                expect(pool).to.have.property('token')
                expect(pool).to.have.property('rewarder')
            }
        }
    })

    it('should filter chains based on CHAINS_LIST environment variable', async () => {
        // Get chains that support rewarder
        const supportedChains = getChainsThatSupportStaking()
        const selectedChains = [supportedChains[0].name, supportedChains[1].name]

        process.env.CHAINS_LIST = selectedChains.join(',')

        // Get rewarder config
        const config = await stakingConfig()

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

    it('should use the correct safe address for owner', async () => {
        // Get rewarder config
        const config = await stakingConfig()

        // Check that each contract has the correct safe address
        for (const contract of config.contracts) {
            const safeAddress = getSafeAddress(contract.contract.eid)
            expect(contract.config.owner).to.equal(safeAddress)
        }
    })

    it('should throw an error when invalid chains are provided', async () => {
        process.env.CHAINS_LIST = 'InvalidChain1,InvalidChain2'

        try {
            await stakingConfig()
            expect.fail('Expected an error to be thrown')
        } catch (error: any) {
            expect(error.message).to.include('Invalid chain: InvalidChain1')
        }
    })

    it('should remove the invalid chains when they are provided and are not supported', async () => {
        // Get chains that do not support rewarder
        const allValidChains = getAllSupportedChains()
        const supportedChains = getChainsThatSupportStaking()
        const supportedChainNames = supportedChains.map((chain) => chain.name)
        const unsupportedChains = allValidChains.filter((chainName) => !supportedChainNames.includes(chainName))

        process.env.CHAINS_LIST = unsupportedChains.join(',')

        const config = await stakingConfig()

        // from chains should be empty so will use all chains
        const fromChainEids = supportedChains.map((chain) => chain.eid)
        const toChainEids = supportedChains.map((chain) => chain.eid)

        // check the config has no contracts for the unsupported chains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }
    })
})
