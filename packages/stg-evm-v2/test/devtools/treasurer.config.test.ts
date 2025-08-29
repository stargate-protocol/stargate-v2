import '@nomiclabs/hardhat-ethers'

import { expect } from 'chai'
import hre from 'hardhat'

import treasurerConfig from '../../devtools/config/mainnet/01/treasurer.config'
import { getOneSigAddress } from '../../devtools/config/utils'
import { getAllSupportedChains, getChainsThatSupportTreasurer } from '../../devtools/config/utils/utils.config'

describe('treasurer.config', () => {
    let originalEnv: NodeJS.ProcessEnv
    let originalPaths: any

    before(async () => {
        // In the config creation the hre paths are being modified.
        // Save original paths
        originalPaths = { ...hre.config.paths }

        // Save original environment variables
        originalEnv = { ...process.env }
    })

    beforeEach(async () => {
        // clean env
        process.env = {}
    })

    after(async () => {
        // restore original paths
        hre.config.paths = originalPaths

        // restore original environment variables
        process.env = originalEnv
    })

    it('should generate correct configuration for all chains (use all chains since no CHAINS_LIST is provided)', async () => {
        const supportedChains = getChainsThatSupportTreasurer()

        // Get treasurer config
        const config = await treasurerConfig()

        // Check that config is generated with contracts and connections
        expect(config).to.have.property('contracts')
        expect(config).to.have.property('connections')

        // Check that all contracts are included
        expect(config.contracts.length).to.equal(supportedChains.length)

        // Check that each contract has the correct structure
        for (const contract of config.contracts) {
            expect(contract).to.have.property('contract')
            expect(contract).to.have.property('config')
            expect(contract.contract).to.have.property('contractName', 'Treasurer')
            expect(contract.config).to.have.property('owner')
            expect(contract.config).to.have.property('admin')
            expect(contract.config).to.have.property('assets')
        }
    })

    it('should filter chains based on CHAINS_LIST environment variable', async () => {
        // Get chains that support treasurer
        const supportedChains = getChainsThatSupportTreasurer()
        const selectedChains = [supportedChains[0].name, supportedChains[1].name]

        process.env.CHAINS_LIST = selectedChains.join(',')

        // Get treasurer config
        const config = await treasurerConfig()

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

    it('should use the correct safe address for owner and admin', async () => {
        // Get treasurer config
        const config = await treasurerConfig()

        // Check that each contract has the correct safe address
        for (const contract of config.contracts) {
            const oneSigAddress = getOneSigAddress(contract.contract.eid)
            expect(contract.config.owner).to.equal(oneSigAddress)
            expect(contract.config.admin).to.equal(oneSigAddress)
        }
    })

    it('should throw an error when invalid chains are provided', async () => {
        process.env.CHAINS_LIST = 'InvalidChain1,InvalidChain2'

        try {
            await treasurerConfig()
            expect.fail('Expected an error to be thrown')
        } catch (error: any) {
            expect(error.message).to.include('Invalid chain: InvalidChain1')
        }
    })

    it('should remove the invalid chains when they are provided and are not supported', async () => {
        // Get chains that do not support treasurer
        const allValidChains = getAllSupportedChains()
        const supportedChains = getChainsThatSupportTreasurer()
        const supportedChainNames = supportedChains.map((chain) => chain.name)
        const unsupportedChains = allValidChains.filter((chainName) => !supportedChainNames.includes(chainName))

        process.env.CHAINS_LIST = unsupportedChains.join(',')

        const config = await treasurerConfig()

        // from chains should be empty so will use all chains
        const fromChainEids = supportedChains.map((chain) => chain.eid)
        const toChainEids = supportedChains.map((chain) => chain.eid)

        // check the config has no contracts for the unsupported chains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }
    })
})
