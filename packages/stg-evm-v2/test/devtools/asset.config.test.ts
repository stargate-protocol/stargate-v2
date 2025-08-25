import '@nomiclabs/hardhat-ethers'

import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import hre from 'hardhat'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import assetEthConfig from '../../devtools/config/mainnet/01/asset.eth.config'
import assetEurcConfig from '../../devtools/config/mainnet/01/asset.eurc.config'
import assetMethConfig from '../../devtools/config/mainnet/01/asset.meth.config'
import assetMetisConfig from '../../devtools/config/mainnet/01/asset.metis.config'
import assetUsdcConfig from '../../devtools/config/mainnet/01/asset.usdc.config'
import assetUsdtConfig from '../../devtools/config/mainnet/01/asset.usdt.config'
import { DEFAULT_PLANNER } from '../../devtools/config/mainnet/01/constants'
import { filterConnections, generateAssetConfig } from '../../devtools/config/utils'
import { getAllSupportedChains, getChainsThatSupportToken } from '../../devtools/config/utils/utils.config'

import { setupConfigTestEnvironment } from './utils'

describe('asset.config', () => {
    setupConfigTestEnvironment(hre)

    describe('ETH Asset Config', () => {
        testAssetConfig(TokenName.ETH, ASSETS.ETH.assetId, assetEthConfig)
    })

    describe('mETH Asset Config', () => {
        testAssetConfig(TokenName.mETH, ASSETS.mETH.assetId, assetMethConfig)
    })

    describe('METIS Asset Config', () => {
        testAssetConfig(TokenName.METIS, ASSETS.METIS.assetId, assetMetisConfig)
    })

    describe('USDC Asset Config', () => {
        testAssetConfig(TokenName.USDC, ASSETS.USDC.assetId, assetUsdcConfig)
    })

    describe('USDT Asset Config', () => {
        testAssetConfig(TokenName.USDT, ASSETS.USDT.assetId, assetUsdtConfig)
    })

    describe('EURC Asset Config', () => {
        testAssetConfig(TokenName.EURC, ASSETS.EURC.assetId, assetEurcConfig)
    })
})

function testAssetConfig(
    tokenName: TokenName,
    assetId: number,
    assetConfig: () => Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>>
) {
    it('should generate correct configuration for all chains (use all chains since no FROM_CHAINS or TO_CHAINS are provided)', async () => {
        const supportedChains = getChainsThatSupportToken(tokenName)
        // Get ETH asset config
        const config = await assetConfig()

        // Check that config is generated with contracts and connections
        expect(config, 'config property').to.have.property('contracts')
        expect(config, 'connections property').to.have.property('connections')

        // Check that all contracts are included
        expect(config.contracts.length, 'contracts length').to.equal(supportedChains.length)

        // Check that each contract has the correct structure
        for (const contract of config.contracts) {
            expect(contract, 'contract property').to.have.property('contract')
            expect(contract, 'config property').to.have.property('config')
            expect(contract.config.assetId, 'assetId property').to.equal(assetId)
            expect(contract.config.addressConfig, 'planner property').to.have.property('planner', DEFAULT_PLANNER)
        }

        // Check that connections are properly filtered
        const allContracts = config.contracts.map((c) => c.contract)
        const allConnections = generateAssetConfig(tokenName, allContracts)
        const expectedFilteredConnections = filterConnections(allConnections, allContracts, allContracts)

        expect(config.connections, 'connections').to.deep.equal(expectedFilteredConnections)
    })

    it('should filter connections based on FROM_CHAINS and TO_CHAINS environment variables', async () => {
        // Get chains that support ETH
        const supportedChains = getChainsThatSupportToken(tokenName)
        let fromChains: string[] = []
        let toChains: string[] = []

        if (supportedChains.length < 1) {
            // do nothing if no chains support the token or only one chain supports the token
            return
        }

        if (supportedChains.length < 4) {
            fromChains = [supportedChains[0].name]
        } else {
            fromChains = [supportedChains[0].name, supportedChains[1].name]
            toChains = [supportedChains[2].name, supportedChains[3].name]
        }
        process.env.FROM_CHAINS = fromChains.join(',')
        process.env.TO_CHAINS = toChains.join(',')

        // Get ETH asset config
        const config = await assetConfig()

        // Check that only contracts from the specified chains are included
        const fromChainEids = supportedChains
            .filter((chain) => fromChains.includes(chain.name))
            .map((chain) => chain.eid)

        // use all chains if no TO_CHAINS are provided
        const toChainEids =
            toChains.length > 0
                ? supportedChains.filter((chain) => toChains.includes(chain.name)).map((chain) => chain.eid)
                : supportedChains.map((chain) => chain.eid)

        // Check that all contracts are from either fromChains or toChains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids], 'contract eid').to.include(contract.contract.eid)
        }

        // Check that connections are properly filtered
        const fromContracts = config.contracts
            .filter((c) => fromChainEids.includes(c.contract.eid))
            .map((c) => c.contract)

        const toContracts = config.contracts.filter((c) => toChainEids.includes(c.contract.eid)).map((c) => c.contract)

        const allContracts = config.contracts.map((c) => c.contract)
        const allConnections = generateAssetConfig(tokenName, allContracts)
        const expectedFilteredConnections = filterConnections(allConnections, fromContracts, toContracts)

        expect(config.connections, 'connections').to.deep.equal(expectedFilteredConnections)
    })

    it('should filter connections based environment variables (FROM_CHAINS == TO_CHAINS)', async () => {
        // Get chains that support the token
        const supportedChains = getChainsThatSupportToken(tokenName)

        if (supportedChains.length === 0) {
            // do nothing if no chains support the token
            return
        }

        const chains = [supportedChains[0].name, supportedChains[1].name]

        process.env.FROM_CHAINS = chains.join(',')
        process.env.TO_CHAINS = chains.join(',')

        // Get asset config
        const config = await assetConfig()

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
        const allConnections = generateAssetConfig(tokenName, allContracts)
        const expectedFilteredConnections = filterConnections(allConnections, fromContracts, toContracts)

        expect(config.connections).to.deep.equal(expectedFilteredConnections)

        // check connections are only included once
        // there should be n * (n - 1) connections for n chains
        expect(expectedFilteredConnections.length).to.equal(chains.length * (chains.length - 1))
    })

    it('should throw an error when invalid chains are provided', async () => {
        // Define invalid chains
        process.env.FROM_CHAINS = 'InvalidChain1,InvalidChain2'

        // Check that the error is thrown
        try {
            await assetConfig()
            expect.fail('Expected an error to be thrown')
        } catch (error: any) {
            expect(error.message).to.include('Invalid chain: InvalidChain1')
        }
    })

    it('should remove the invalid chains when they are provided and are not supported', async () => {
        // Get chains that do not support the token
        const allValidChains = getAllSupportedChains()
        const supportedChains = getChainsThatSupportToken(tokenName)
        const supportedChainNames = supportedChains.map((chain) => chain.name)
        const unsupportedChains = allValidChains.filter((chainName) => !supportedChainNames.includes(chainName))

        process.env.FROM_CHAINS = unsupportedChains.join(',')

        const config = await assetConfig()

        // from chains should be empty so will use all chains
        const fromChainEids = supportedChains.map((chain) => chain.eid)
        const toChainEids = supportedChains.map((chain) => chain.eid)

        // check the config has no contracts for the unsupported chains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }
    })
}
