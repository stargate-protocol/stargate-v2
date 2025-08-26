import '@nomiclabs/hardhat-ethers'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { FeeLibV1EdgeConfig, FeeLibV1NodeConfig } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import hre from 'hardhat'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { DEFAULT_PLANNER } from '../../devtools/config/mainnet/01/constants'
import feelibEthConfig from '../../devtools/config/mainnet/01/feelib-v1.eth.config'
import feelibEurcConfig from '../../devtools/config/mainnet/01/feelib-v1.eurc.config'
import feelibMethConfig from '../../devtools/config/mainnet/01/feelib-v1.meth.config'
import feelibMetisConfig from '../../devtools/config/mainnet/01/feelib-v1.metis.config'
import feelibUsdcConfig from '../../devtools/config/mainnet/01/feelib-v1.usdc.config'
import feelibUsdtConfig from '../../devtools/config/mainnet/01/feelib-v1.usdt.config'
import { getAllSupportedChains, getChainsThatSupportToken } from '../../devtools/config/utils/utils.config'

import { setupConfigTestEnvironment } from './utils'

describe('feelib_v1.config', () => {
    setupConfigTestEnvironment(hre)

    describe('ETH FeeLib Config', () => {
        testFeeLibConfig(TokenName.ETH, feelibEthConfig)
    })

    describe('mETH FeeLib Config', () => {
        testFeeLibConfig(TokenName.mETH, feelibMethConfig)
    })

    describe('METIS FeeLib Config', () => {
        testFeeLibConfig(TokenName.METIS, feelibMetisConfig)
    })

    describe('USDC FeeLib Config', () => {
        testFeeLibConfig(TokenName.USDC, feelibUsdcConfig)
    })

    describe('USDT FeeLib Config', () => {
        testFeeLibConfig(TokenName.USDT, feelibUsdtConfig)
    })

    describe('EURC FeeLib Config', () => {
        testFeeLibConfig(TokenName.EURC, feelibEurcConfig)
    })
})

function testFeeLibConfig(
    tokenName: TokenName,
    feeLibConfig: () => Promise<OmniGraphHardhat<FeeLibV1NodeConfig, FeeLibV1EdgeConfig>>
) {
    it('should generate correct configuration for all chains (use all chains since no CHAINS_LIST is provided)', async () => {
        const supportedChains = getChainsThatSupportToken(tokenName)

        // Get FeeLib config
        const config = await feeLibConfig()

        // Check that config is generated with contracts
        expect(config, 'config property').to.have.property('contracts')
        expect(config, 'connections property').to.have.property('connections')

        // Check that all contracts are included
        expect(config.contracts.length, 'contracts length').to.equal(supportedChains.length)

        // Check that each contract has the correct structure
        for (const contract of config.contracts) {
            expect(contract, 'contract property').to.have.property('contract')
            expect(contract, 'config property').to.have.property('config')
            expect(contract.config, 'owner property').to.have.property('owner', DEFAULT_PLANNER)
        }

        // Check that connections array is empty (as per feelib config structure)
        expect(config.connections, 'connections').to.be.an('array').that.is.empty
    })

    it('should filter contracts based on CHAINS_LIST environment variable', async () => {
        // Get chains that support the token
        const supportedChains = getChainsThatSupportToken(tokenName)

        if (supportedChains.length < 2) {
            // do nothing if no chains support the token or only one chain supports the token
            return
        }

        const chainsList = [supportedChains[0].name, supportedChains[1].name]
        process.env.CHAINS_LIST = chainsList.join(',')

        // Get FeeLib config
        const config = await feeLibConfig()

        // Check that only contracts from the specified chains are included
        const chainEids = supportedChains.filter((chain) => chainsList.includes(chain.name)).map((chain) => chain.eid)

        // Check that all contracts are from the specified chains
        for (const contract of config.contracts) {
            expect(chainEids, 'contract eid').to.include(contract.contract.eid)
        }

        // Check that we have exactly the number of contracts we expect
        expect(config.contracts.length).to.equal(chainsList.length)

        // Check that connections array is empty (as per feelib config structure)
        expect(config.connections, 'connections').to.be.an('array').that.is.empty
    })

    it('should throw an error when invalid chains are provided', async () => {
        // Define invalid chains
        process.env.CHAINS_LIST = 'InvalidChain1,InvalidChain2'

        // Check that the error is thrown
        try {
            await feeLibConfig()
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
        const unsupportedChains = allValidChains.filter((chainName: string) => !supportedChainNames.includes(chainName))

        process.env.CHAINS_LIST = unsupportedChains.join(',')

        const config = await feeLibConfig()

        // from chains should be empty so will use all chains
        const fromChainEids = supportedChains.map((chain) => chain.eid)
        const toChainEids = supportedChains.map((chain) => chain.eid)

        // check the config has no contracts for the unsupported chains
        for (const contract of config.contracts) {
            expect([...fromChainEids, ...toChainEids]).to.include(contract.contract.eid)
        }
    })
}
