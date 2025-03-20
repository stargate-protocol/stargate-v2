import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { Asset } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import sinon from 'sinon'

import { assertHardhatDeploy, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import {
    getContracts as getContractsMainnet,
    isValidCreditMessagingChain as isValidCreditMessagingChainMainnet,
    validCreditMessagingChains as validCreditMessagingChainsMainnet,
} from '../../devtools/config/mainnet/utils'
import {
    getContracts as getContractsTestnet,
    isValidCreditMessagingChain as isValidCreditMessagingChainTestnet,
    validCreditMessagingChains as validCreditMessagingChainsTestnet,
} from '../../devtools/config/testnet/utils'
import { filterConnections, getContractWithEid, setsDifference } from '../../devtools/config/utils'
import { createGetAssetAddresses, createGetLPTokenAddresses, getAddress } from '../../ts-src/utils/util'

describe('devtools/utils', () => {
    describe('createGetAssetAddresses()', () => {
        it('should return an empty object if called with no tokens', async () => {
            const getTokenAddresses = createGetAssetAddresses()

            expect(await getTokenAddresses(EndpointId.BSC_V2_SANDBOX, [])).to.eql({})
        })

        it('should return an object containing token addresses by their names', async () => {
            const getHre = createGetHreByEid()
            const getTokenAddresses = createGetAssetAddresses(getHre)

            const bscHre = await getHre(EndpointId.BSC_V2_SANDBOX)

            // For some reason TypeScript does not load the hardhat-deploy type extensions
            // so we have to explicitly ensure that the deployments extension is there
            assertHardhatDeploy(bscHre)

            // We need to stub all the network calls since we don't have the network node running
            const detectNetworkStub = sinon.stub(bscHre.network.provider, 'send').resolves('889156')

            try {
                expect(await getTokenAddresses(EndpointId.BSC_V2_SANDBOX, [TokenName.USDT])).to.eql({
                    [TokenName.USDT]: await bscHre.deployments.get(`StargateOFTUSDT`).then(getAddress),
                })
            } finally {
                detectNetworkStub.restore()
            }
        })
    })

    describe('createGetLPTokenAddresses()', () => {
        it('should return an empty object if called with no tokens', async () => {
            const getTokenAddresses = createGetLPTokenAddresses()

            expect(await getTokenAddresses(EndpointId.BSC_V2_SANDBOX, [])).to.eql({})
        })

        it('should return an object containing token addresses by their names', async () => {
            const getHre = createGetHreByEid()
            const getTokenAddresses = createGetLPTokenAddresses(getHre)
            const getLPTokenStub = sinon.stub(Asset.prototype, 'getLPToken').resolves('0xLP')

            const bscHre = await getHre(EndpointId.BSC_V2_SANDBOX)

            // For some reason TypeScript does not load the hardhat-deploy type extensions
            // so we have to explicitly ensure that the deployments extension is there
            assertHardhatDeploy(bscHre)

            // We need to stub all the network calls since we don't have the network node running
            const detectNetworkStub = sinon.stub(bscHre.network.provider, 'send').resolves('889156')

            try {
                expect(await getTokenAddresses(EndpointId.BSC_V2_SANDBOX, [TokenName.USDC])).to.eql({
                    [TokenName.USDC]: '0xLP',
                })
            } finally {
                detectNetworkStub.restore()
                getLPTokenStub.restore()
            }
        })

        it('should reject if there is no LP token', async () => {
            const getHre = createGetHreByEid()
            const getTokenAddresses = createGetLPTokenAddresses(getHre)
            const getLPTokenStub = sinon.stub(Asset.prototype, 'getLPToken').resolves(undefined)

            const bscHre = await getHre(EndpointId.BSC_V2_SANDBOX)

            // For some reason TypeScript does not load the hardhat-deploy type extensions
            // so we have to explicitly ensure that the deployments extension is there
            assertHardhatDeploy(bscHre)

            // We need to stub all the network calls since we don't have the network node running
            const detectNetworkStub = sinon.stub(bscHre.network.provider, 'send').resolves('889156')

            try {
                expect(getTokenAddresses(EndpointId.BSC_V2_SANDBOX, [TokenName.USDC])).to.be.revertedWith(
                    'Missing LP Token address'
                )
            } finally {
                detectNetworkStub.restore()
                getLPTokenStub.restore()
            }
        })
    })

    describe('getContracts', () => {
        const mockContractData = { contractName: 'MockContract' }

        it('should return all valid contracts when chains is null', () => {
            // Mainnet
            const result = getContractsMainnet(null, mockContractData, isValidCreditMessagingChainMainnet)
            expect(result.length).to.equal(validCreditMessagingChainsMainnet.size)
            expect(result[0]).to.have.property('eid')
            expect(result[0]).to.have.property('contractName', 'MockContract')

            // Testnet
            const resultTestnet = getContractsTestnet(null, mockContractData, isValidCreditMessagingChainTestnet)
            expect(resultTestnet.length).to.equal(validCreditMessagingChainsTestnet.size)
            expect(resultTestnet[0]).to.have.property('eid')
            expect(resultTestnet[0]).to.have.property('contractName', 'MockContract')
        })

        it('should return specified contracts for valid chain names', () => {
            // Mainnet
            const chains = ['ethereum-mainnet', 'arbitrum-mainnet', 'optimism-mainnet', 'base-mainnet']
            const result = getContractsMainnet(chains, mockContractData, isValidCreditMessagingChainMainnet)
            expect(result.length).to.equal(4)
            expect(result.map((r) => r.eid)).to.have.members([
                EndpointId.ETHEREUM_V2_MAINNET,
                EndpointId.ARBITRUM_V2_MAINNET,
                EndpointId.OPTIMISM_V2_MAINNET,
                EndpointId.BASE_V2_MAINNET,
            ])

            // Testnet
            const chainsTestnet = ['arbsep-testnet', 'bsc-testnet', 'sepolia-testnet', 'opt-testnet']
            const resultTestnet = getContractsTestnet(
                chainsTestnet,
                mockContractData,
                isValidCreditMessagingChainTestnet
            )
            expect(resultTestnet.length).to.equal(4)
            expect(resultTestnet.map((r) => r.eid)).to.have.members([
                EndpointId.ARBSEP_V2_TESTNET,
                EndpointId.BSC_V2_TESTNET,
                EndpointId.SEPOLIA_V2_TESTNET,
                EndpointId.OPTSEP_V2_TESTNET,
            ])
        })

        it('should throw an error for invalid chain names', () => {
            // Mainnet
            const chains = [
                'ethereum-mainnet',
                'invalid-chain-1',
                'arbitrum-mainnet',
                'invalid-chain-2',
                'base-mainnet',
            ]
            expect(() => getContractsMainnet(chains, mockContractData, isValidCreditMessagingChainMainnet)).to.throw(
                'Invalid chains found: invalid-chain-1, invalid-chain-2'
            )

            // Testnet
            const chainsTestnet = ['arbsep-testnet', 'invalid-chain-1', 'bsc-testnet', 'invalid-chain-2']
            expect(() =>
                getContractsTestnet(chainsTestnet, mockContractData, isValidCreditMessagingChainTestnet)
            ).to.throw('Invalid chains found: invalid-chain-1, invalid-chain-2')
        })

        it('should trim whitespace from chain names', () => {
            // Mainnet
            const chains = [' ethereum-mainnet', 'arbitrum-mainnet ', '  base-mainnet']
            const result = getContractsMainnet(chains, mockContractData, isValidCreditMessagingChainMainnet)
            expect(result.length).to.equal(3)
            expect(result.map((r) => r.eid)).to.have.members([
                EndpointId.ETHEREUM_V2_MAINNET,
                EndpointId.ARBITRUM_V2_MAINNET,
                EndpointId.BASE_V2_MAINNET,
            ])

            // Testnet
            const chainsTestnet = ['arbsep-testnet     ', '    bsc-testnet', ' sepolia-testnet ']
            const resultTestnet = getContractsTestnet(
                chainsTestnet,
                mockContractData,
                isValidCreditMessagingChainTestnet
            )
            expect(resultTestnet.length).to.equal(3)
            expect(resultTestnet.map((r) => r.eid)).to.have.members([
                EndpointId.ARBSEP_V2_TESTNET,
                EndpointId.BSC_V2_TESTNET,
                EndpointId.SEPOLIA_V2_TESTNET,
            ])
        })

        it('should return all valid contracts for an empty input array', () => {
            // Mainnet
            const result = getContractsMainnet([], mockContractData, isValidCreditMessagingChainMainnet)
            expect(result.length).to.equal(validCreditMessagingChainsMainnet.size)

            // Testnet
            const resultTestnet = getContractsTestnet([], mockContractData, isValidCreditMessagingChainTestnet)
            expect(resultTestnet.length).to.equal(validCreditMessagingChainsTestnet.size)
        })
    })

    describe('filterConnections', () => {
        const mockConnections = [
            { from: { eid: 1 }, to: { eid: 2 }, data: 'A' },
            { from: { eid: 2 }, to: { eid: 3 }, data: 'B' },
            { from: { eid: 3 }, to: { eid: 1 }, data: 'C' },
            { from: { eid: 1 }, to: { eid: 3 }, data: 'D' },
            { from: { eid: 2 }, to: { eid: 1 }, data: 'E' },
            { from: { eid: 4 }, to: { eid: 5 }, data: 'F' },
        ]

        it('should filter connections based on from and to contracts', () => {
            const mockFromContracts = [{ eid: 1 }, { eid: 2 }]
            const mockToContracts = [{ eid: 2 }, { eid: 3 }]
            const result = filterConnections(mockConnections, mockFromContracts, mockToContracts)
            expect(result.length).to.equal(3)
            expect(result).to.deep.include({ from: { eid: 1 }, to: { eid: 2 }, data: 'A' })
            expect(result).to.deep.include({ from: { eid: 1 }, to: { eid: 3 }, data: 'D' })
            expect(result).to.deep.include({ from: { eid: 2 }, to: { eid: 3 }, data: 'B' })
        })

        it.only('lalalaa', async () => {
            const bla = await import('../../devtools/config/mainnet/01/oft-token.config')

            const result = await bla.default()

            console.log(JSON.stringify(result, null, 2))
        })

        it('should handle overlapping from and to contracts', () => {
            const mockFromContracts = [{ eid: 1 }, { eid: 2 }, { eid: 3 }]
            const mockToContracts = [{ eid: 1 }, { eid: 2 }, { eid: 3 }]
            const result = filterConnections(mockConnections, mockFromContracts, mockToContracts)
            expect(result.length).to.equal(5)
            expect(result).to.not.deep.include({ from: { eid: 4 }, to: { eid: 5 }, data: 'F' })
        })

        it('should return empty array when no connections match', () => {
            const noMatchFromContracts = [{ eid: 5 }]
            const noMatchToContracts = [{ eid: 4 }]
            const result = filterConnections(mockConnections, noMatchFromContracts, noMatchToContracts)
            expect(result.length).to.equal(0)
        })

        it('should handle empty input arrays', () => {
            const result = filterConnections([], [], [])
            expect(result.length).to.equal(0)
        })

        it('should handle scenario with multiple matching connections', () => {
            const complexConnections = [
                { from: { eid: 1 }, to: { eid: 2 } },
                { from: { eid: 1 }, to: { eid: 3 } },
                { from: { eid: 1 }, to: { eid: 4 } },
                { from: { eid: 2 }, to: { eid: 3 } },
                { from: { eid: 2 }, to: { eid: 4 } },
                { from: { eid: 3 }, to: { eid: 4 } },
            ]
            const fromContracts = [{ eid: 1 }, { eid: 2 }]
            const toContracts = [{ eid: 3 }, { eid: 4 }]
            const result = filterConnections(complexConnections, fromContracts, toContracts)
            expect(result.length).to.equal(4)
            expect(result).to.deep.include({ from: { eid: 1 }, to: { eid: 3 } })
            expect(result).to.deep.include({ from: { eid: 1 }, to: { eid: 4 } })
            expect(result).to.deep.include({ from: { eid: 2 }, to: { eid: 3 } })
            expect(result).to.deep.include({ from: { eid: 2 }, to: { eid: 4 } })
        })
    })

    describe('setsDifference', () => {
        const mockContractData = { contractName: 'MockContract' }

        it('should return empty set when sets are identical', () => {
            const setA = new Set(['a', 'b', 'c'])
            const result = setsDifference(setA, setA)

            expect(result.size).to.equal(0)
        })

        it('should return all elements when sets are disjoint', () => {
            const setA = new Set(['a', 'b', 'c'])
            const setB = new Set(['d', 'e', 'f'])
            const result = setsDifference(setA, setB)

            expect(result.size).to.equal(setA.size)
            expect(result).to.deep.equal(setA)
        })

        it('should return elements in setA that are not in setB', () => {
            const setA = new Set(['a', 'b', 'c'])
            const setB = new Set(['b', 'd', 'e'])
            const result = setsDifference(setA, setB)

            expect(result.size).to.equal(2)
            expect(result).to.deep.equal(new Set(['a', 'c']))
        })

        it('should handle empty sets', () => {
            const setA = new Set(['a', 'b', 'c'])
            const setB = new Set([])
            const result = setsDifference(setA, setB)

            expect(result.size).to.equal(setA.size)
            expect(result).to.deep.equal(setA)
        })
    })

    describe('getContractWithEid', () => {
        const mockContractData = { contractName: 'MockContract' }
        const mockBigContractData = {
            address: '0x123',
            name: 'TestContract',
            abi: ['test'],
            customField: 'value',
        }
        const eids = [EndpointId.ETHEREUM_MAINNET, EndpointId.BSC_MAINNET, EndpointId.AVALANCHE_MAINNET]

        it('should correctly combine EID with contract', () => {
            const eid = eids[0]

            const result = getContractWithEid(eid, mockContractData)

            expect(result).to.deep.equal({
                ...mockContractData,
                eid,
            })
        })

        it('should work with different EIDs', () => {
            eids.forEach((eid) => {
                const result = getContractWithEid(eid, mockContractData)
                expect(result.eid).to.equal(eid)
            })
        })

        it('should preserve all original contract properties', () => {
            const eid = eids[0]

            const result = getContractWithEid(eid, mockBigContractData)

            expect(result).to.deep.equal({
                ...mockBigContractData,
                eid,
            })
            expect(result.address).to.equal(mockBigContractData.address)
            expect(result.name).to.equal(mockBigContractData.name)
            expect(result.abi).to.deep.equal(mockBigContractData.abi)
            expect(result.customField).to.equal(mockBigContractData.customField)
        })
    })
})
