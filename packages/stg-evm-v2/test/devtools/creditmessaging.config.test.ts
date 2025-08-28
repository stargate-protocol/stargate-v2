import '@nomiclabs/hardhat-ethers'

import { expect } from 'chai'
import hre from 'hardhat'

import { DEFAULT_PLANNER } from '../../devtools/config/mainnet/01/constants'
import creditMessagingConfig from '../../devtools/config/mainnet/01/credit-messaging.config'
import { filterConnections, generateCreditMessagingConfig, getSafeAddress } from '../../devtools/config/utils'
import {
    getAllSupportedChains,
    getChainsThatSupportMessaging,
    getSupportedTokensByEid,
} from '../../devtools/config/utils/utils.config'

import { setupConfigTestEnvironment } from './utils'

describe('creditMessaging.config', () => {
    setupConfigTestEnvironment(hre)

    it('should generate correct configuration for all chains (use all chains since no FROM_CHAINS or TO_CHAINS are provided)', async () => {
        const supportedChains = getChainsThatSupportMessaging()

        // Get credit messaging config
        const config = await creditMessagingConfig()

        // Check that config is generated with contracts and connections
        expect(config).to.have.property('contracts')
        expect(config).to.have.property('connections')

        // Check that all contracts are included
        expect(config.contracts.length).to.equal(supportedChains.length)

        // Check that each contract has the correct structure
        for (const contract of config.contracts) {
            expect(contract).to.have.property('contract')
            expect(contract).to.have.property('config')
            expect(contract.contract).to.have.property('contractName', 'CreditMessaging')
            expect(contract.config).to.have.property('owner')
            expect(contract.config).to.have.property('delegate')
            expect(contract.config).to.have.property('planner', DEFAULT_PLANNER)
            expect(contract.config).to.have.property('assets')
        }
    })

    it('should filter connections based on FROM_CHAINS and TO_CHAINS environment variables', async () => {
        // Get chains that support messaging
        const supportedChains = getChainsThatSupportMessaging()
        const fromChains = [supportedChains[0].name, supportedChains[1].name]
        const toChains = [supportedChains[2].name, supportedChains[3].name]

        process.env.FROM_CHAINS = fromChains.join(',')
        process.env.TO_CHAINS = toChains.join(',')

        // Get credit messaging config
        const config = await creditMessagingConfig()

        // Check that only contracts from the specified chains are included
        const fromChainEids = supportedChains
            .filter((chain) => fromChains.includes(chain.name))
            .map((chain) => chain.eid)

        const toChainEids = supportedChains.filter((chain) => toChains.includes(chain.name)).map((chain) => chain.eid)

        // Check that all contracts are from either fromChains or toChains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }

        // Check that connections are properly filtered
        const fromContracts = config.contracts
            .filter((c) => fromChainEids.includes(c.contract.eid))
            .map((c) => c.contract)

        const toContracts = config.contracts.filter((c) => toChainEids.includes(c.contract.eid)).map((c) => c.contract)

        const allContracts = config.contracts.map((c) => c.contract)
        const allConnections = generateCreditMessagingConfig(allContracts)
        const expectedFilteredConnections = filterConnections(allConnections, fromContracts, toContracts)

        expect(config.connections).to.deep.equal(expectedFilteredConnections)
    })

    it('should filter connections based environment variables (FROM_CHAINS == TO_CHAINS)', async () => {
        // Get chains that support messaging
        const supportedChains = getChainsThatSupportMessaging()
        const chains = [supportedChains[0].name, supportedChains[1].name]

        process.env.FROM_CHAINS = chains.join(',')
        process.env.TO_CHAINS = chains.join(',')

        // Get credit messaging config
        const config = await creditMessagingConfig()

        // Check that only contracts from the specified chains are included
        const fromChainEids = supportedChains.filter((chain) => chains.includes(chain.name)).map((chain) => chain.eid)

        const toChainEids = supportedChains.filter((chain) => chains.includes(chain.name)).map((chain) => chain.eid)

        // Check that all contracts are from either fromChains or toChains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }

        // check contracts are only included once
        const uniqueContracts = new Set(config.contracts.map((c) => c.contract.eid))
        expect(uniqueContracts.size).to.equal(chains.length)

        // Check that connections are properly filtered
        const fromContracts = config.contracts
            .filter((c) => fromChainEids.includes(c.contract.eid))
            .map((c) => c.contract)

        const toContracts = config.contracts.filter((c) => toChainEids.includes(c.contract.eid)).map((c) => c.contract)

        const allContracts = config.contracts.map((c) => c.contract)
        const allConnections = generateCreditMessagingConfig(allContracts)
        const expectedFilteredConnections = filterConnections(allConnections, fromContracts, toContracts)

        expect(config.connections).to.deep.equal(expectedFilteredConnections)

        // check connections are only included once
        // there should be n * (n - 1) connections for n chains
        expect(expectedFilteredConnections.length).to.equal(chains.length * (chains.length - 1))
    })

    it('should generate correct assets configuration for each contract', async () => {
        // Get credit messaging config
        const config = await creditMessagingConfig()

        // Check that each contract has the correct assets configuration
        for (const contract of config.contracts) {
            getSupportedTokensByEid(contract.contract.eid)
            expect(contract.config.assets).to.be.an('object')

            // Check that each asset has the correct structure
            if (contract.config.assets) {
                for (const [address, assetId] of Object.entries(contract.config.assets)) {
                    expect(address).to.be.a('string')
                    expect(assetId).to.be.a('number')
                }
            }
        }
    })

    it('should use the correct safe address for owner and delegate', async () => {
        // Get credit messaging config
        const config = await creditMessagingConfig()

        // Check that each contract has the correct safe address
        for (const contract of config.contracts) {
            const safeAddress = getSafeAddress(contract.contract.eid)
            expect(contract.config.owner).to.equal(safeAddress)
            expect(contract.config.delegate).to.equal(safeAddress)
        }
    })

    it('should throw an error when invalid chains are provided', async () => {
        // Define invalid chains
        process.env.FROM_CHAINS = 'InvalidChain1,InvalidChain2'

        // Check that the error is thrown
        try {
            await creditMessagingConfig()
            expect.fail('Expected an error to be thrown')
        } catch (error: any) {
            expect(error.message).to.include('Invalid chain: InvalidChain1')
        }
    })

    it('should remove the invalid chains when they are provided and are not supported', async () => {
        // Get chains that do not support messaging
        const allValidChains = getAllSupportedChains()
        const supportedChains = getChainsThatSupportMessaging()
        const supportedChainNames = supportedChains.map((chain) => chain.name)
        const unsupportedChains = allValidChains.filter((chainName) => !supportedChainNames.includes(chainName))

        process.env.FROM_CHAINS = unsupportedChains.join(',')

        const config = await creditMessagingConfig()

        // from chains should be empty so will use all chains
        const fromChainEids = supportedChains.map((chain) => chain.eid)
        const toChainEids = supportedChains.map((chain) => chain.eid)

        // check the config has no contracts for the unsupported chains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }
    })
})
