import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { Asset } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import sinon from 'sinon'

import { assertHardhatDeploy, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { chainFunctions, filterConnections, getContracts } from '../../devtools/config/mainnet/utils'
import { createGetAssetAddresses, createGetLPTokenAddresses, getAddress } from '../../ts-src/utils/util'

describe('devtools/utils', () => {
    const mockContractData = { contractName: 'MockContract' }

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
        it('should return all contracts when chains is null', () => {
            const result = getContracts(null, mockContractData)
            expect(result.length).to.equal(Object.keys(chainFunctions).length)
            expect(result[0]).to.have.property('eid')
            expect(result[0]).to.have.property('contractName', 'MockContract')
        })

        it('should return specified contracts for valid chain names', () => {
            const chains = ['ethereum-mainnet', 'arbitrum-mainnet']
            const result = getContracts(chains, mockContractData)
            expect(result.length).to.equal(2)
            expect(result[0].eid).to.equal(EndpointId.ETHEREUM_V2_MAINNET)
            expect(result[1].eid).to.equal(EndpointId.ARBITRUM_V2_MAINNET)
        })

        it('should ignore invalid chain names', () => {
            const chains = ['ethereum-mainnet', 'invalid-chain']
            const result = getContracts(chains, mockContractData)
            expect(result.length).to.equal(1)
            expect(result[0].eid).to.equal(EndpointId.ETHEREUM_V2_MAINNET)
        })

        it('should trim whitespace from chain names', () => {
            const chains = [' ethereum-mainnet ', 'arbitrum-mainnet ']
            const result = getContracts(chains, mockContractData)
            expect(result.length).to.equal(2)
            expect(result[0].eid).to.equal(EndpointId.ETHEREUM_V2_MAINNET)
            expect(result[1].eid).to.equal(EndpointId.ARBITRUM_V2_MAINNET)
        })
    })

    describe('filterConnections', () => {
        const mockConnections = [
            { from: { eid: 1 }, to: { eid: 2 } },
            { from: { eid: 2 }, to: { eid: 3 } },
            { from: { eid: 3 }, to: { eid: 1 } },
            { from: { eid: 1 }, to: { eid: 3 } },
        ]

        const mockFromContracts = [{ eid: 1 }, { eid: 2 }]
        const mockToContracts = [{ eid: 2 }, { eid: 3 }]

        it('should filter connections based on from and to contracts', () => {
            const result = filterConnections(mockConnections, mockFromContracts, mockToContracts)
            expect(result.length).to.equal(3)
            expect(result).to.deep.include({ from: { eid: 1 }, to: { eid: 2 } })
            expect(result).to.deep.include({ from: { eid: 1 }, to: { eid: 3 } })
            expect(result).to.deep.include({ from: { eid: 2 }, to: { eid: 3 } })
        })

        it('should return empty array when no connections match', () => {
            const noMatchFromContracts = [{ eid: 4 }]
            const noMatchToContracts = [{ eid: 5 }]
            const result = filterConnections(mockConnections, noMatchFromContracts, noMatchToContracts)
            expect(result.length).to.equal(0)
        })

        it('should handle empty input arrays', () => {
            const result = filterConnections([], [], [])
            expect(result.length).to.equal(0)
        })
    })
})
