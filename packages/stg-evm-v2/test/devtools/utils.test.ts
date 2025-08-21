import { RewardTokenName, StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { Asset } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import sinon from 'sinon'

import { assertHardhatDeploy, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId, Stage } from '@layerzerolabs/lz-definitions'

import { setMainnetStage } from '../../devtools/config/mainnet/utils'
import { filterConnections, getContractWithEid, getContractsInChain, setsDifference } from '../../devtools/config/utils'
import {
    __resetUtilsConfigStateForTests,
    getAllChainsConfig,
    getAllSupportedChains,
    getChainsThatSupportMessaging,
    getChainsThatSupportStaking,
    getChainsThatSupportToken,
    getChainsThatSupportTokenWithType,
    getChainsThatSupportTreasurer,
    getChainsThatSupportsUsdtOftByDeployment,
    getRewardTokenName,
    getSupportedTokensByEid,
    getTokenName,
    isValidChain,
    requireStage,
    setStage,
    validateChains,
} from '../../devtools/config/utils/utils.config'
import { createGetAssetAddresses, createGetLPTokenAddresses, getAddress } from '../../ts-src/utils/util'

describe('devtools/utils', () => {
    before(() => {
        setMainnetStage()
    })

    beforeEach(() => {
        __resetUtilsConfigStateForTests()
    })

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
        beforeEach(() => {
            setStage(Stage.TESTNET)
        })

        const mockContractData = { contractName: 'MockContract' }

        it('should return all valid contracts when chains is null', () => {
            const supportedChains = getChainsThatSupportMessaging()
            // Testnet
            // const resultTestnet = getContractsInChain(null, mockContractData, isValidCreditMessagingChain)
            const chainsThatSupportMessaging = getChainsThatSupportMessaging()
            const resultTestnet = getContractsInChain(
                chainsThatSupportMessaging.map((c) => c.name),
                mockContractData,
                isValidChain,
                chainsThatSupportMessaging
            )
            expect(resultTestnet.length).to.equal(supportedChains.length)
            expect(resultTestnet[0]).to.have.property('eid')
            expect(resultTestnet[0]).to.have.property('contractName', 'MockContract')
        })

        it('should return specified contracts for valid chain names', () => {
            // Testnet
            const chainsTestnet = ['arbsep-testnet', 'bsc-testnet', 'sepolia-testnet', 'optsep-testnet']

            const resultTestnet = getContractsInChain(chainsTestnet, mockContractData, isValidChain, getChainsEID())
            expect(resultTestnet.length).to.equal(4)
            expect(resultTestnet.map((r) => r.eid)).to.have.members([
                EndpointId.ARBSEP_V2_TESTNET,
                EndpointId.BSC_V2_TESTNET,
                EndpointId.SEPOLIA_V2_TESTNET,
                EndpointId.OPTSEP_V2_TESTNET,
            ])
        })

        it('should throw an error for invalid chain names', () => {
            // Testnet
            const chainsTestnet = ['arbsep-testnet', 'invalid-chain-1', 'bsc-testnet', 'invalid-chain-2']
            expect(() => getContractsInChain(chainsTestnet, mockContractData, isValidChain, getChainsEID())).to.throw(
                'Invalid chains found: invalid-chain-1, invalid-chain-2'
            )
        })

        it('should trim whitespace from chain names', () => {
            // Testnet
            const chainsTestnet = ['arbsep-testnet     ', '    bsc-testnet', ' sepolia-testnet ']
            const resultTestnet = getContractsInChain(chainsTestnet, mockContractData, isValidChain, getChainsEID())
            expect(resultTestnet.length).to.equal(3)
            expect(resultTestnet.map((r) => r.eid)).to.have.members([
                EndpointId.ARBSEP_V2_TESTNET,
                EndpointId.BSC_V2_TESTNET,
                EndpointId.SEPOLIA_V2_TESTNET,
            ])
        })

        it('should return all valid contracts for an empty input array', () => {
            // Testnet
            const chainsTestnet = ['arbsep-testnet', 'bsc-testnet', 'sepolia-testnet', 'optsep-testnet']
            const resultTestnet = getContractsInChain(chainsTestnet, mockContractData, isValidChain, getChainsEID())
            expect(resultTestnet.length).to.equal(4)
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

    // utils.config
    describe('supportedChains', () => {
        beforeEach(() => {
            setStage(Stage.MAINNET)
        })

        const validChains = ['ethereum-mainnet', 'arbitrum-mainnet', 'optimism-mainnet', 'base-mainnet']
        const chainsThatSupportUSDTPool = ['ethereum-mainnet', 'avalanche-mainnet']
        const chainsThatSupportUSDTOft = ['degen-mainnet', 'flare-mainnet']

        it('should return all defined chains names', () => {
            const result = getAllSupportedChains()

            expect(result.length).not.to.equal(0)
            expect(result[0]).to.be.a('string')
            expect(result).to.include.members(validChains)
        })

        it('should return all defined chains config', () => {
            const result = getAllChainsConfig()

            expect(result.length).not.to.equal(0)
            expect(result[0]).to.have.property('eid')
            expect(result[0]).to.have.property('tokens')
            expect(result[0]).to.have.property('token_messaging')
            expect(result[0]).to.have.property('credit_messaging')
            expect(result.map((r) => r.name)).to.include.members(validChains)
        })

        it('should return all chains that support a specific token', () => {
            const result = getChainsThatSupportToken(TokenName.USDT)
            const allChains = getAllChainsConfig()

            expect(result.length).not.to.equal(0)
            expect(result.length).to.be.lessThan(allChains.length)
            expect(result.map((r) => r.name)).to.include.members(chainsThatSupportUSDTPool)
            expect(result.map((r) => r.name)).to.include.members(chainsThatSupportUSDTOft)
        })

        it('should return all chains that support a specific token with type', () => {
            const result = getChainsThatSupportTokenWithType(TokenName.USDT, StargateType.Oft)
            const allChains = getAllChainsConfig()

            expect(result.length).not.to.equal(0)
            expect(result.length).to.be.lessThan(allChains.length)
            expect(result.map((r) => r.name)).to.include.members(chainsThatSupportUSDTOft)
            expect(result.map((r) => r.name)).to.not.include.members(chainsThatSupportUSDTPool)
        })

        it('should return all chains that support usdt by deployment (external or not)', () => {
            const result = getChainsThatSupportsUsdtOftByDeployment(false)
            const allChains = getAllChainsConfig()

            expect(result.length).not.to.equal(0)
            expect(result.length).to.be.lessThan(allChains.length)
            expect(result.map((r) => r.name)).to.include.members(['flare-mainnet', 'klaytn-mainnet'])
            expect(result.map((r) => r.name)).to.not.include.members(['peaq-mainnet', 'islander-mainnet'])
        })

        it('should return all chains that support messaging', () => {
            const result = getChainsThatSupportMessaging()
            const allChains = getAllChainsConfig()

            expect(result.length).not.to.equal(0)
            expect(result.length).to.be.lessThan(allChains.length)
            expect(result.map((r) => r.name)).to.include.members(['abstract-mainnet', 'ape-mainnet'])
            expect(result.map((r) => r.name)).to.not.include.members(['astar-mainnet', 'etherlink-mainnet'])
        })

        it('should return all chains that support treasurer', () => {
            const result = getChainsThatSupportTreasurer()
            const allChains = getAllChainsConfig()

            expect(result.length).not.to.equal(0)
            expect(result.length).to.be.lessThan(allChains.length)
            expect(result.map((r) => r.name)).to.include.members(['ethereum-mainnet', 'degen-mainnet'])
            expect(result.map((r) => r.name)).to.not.include.members(['fraxtal-mainnet', 'manta-mainnet'])
        })

        it('should return all chains that support staking', () => {
            const result = getChainsThatSupportStaking()
            const allChains = getAllChainsConfig()

            expect(result.length).not.to.equal(0)
            expect(result.length).to.be.lessThan(allChains.length)
            expect(result.map((r) => r.name)).to.include.members(['ethereum-mainnet', 'hemi-mainnet'])
            expect(result.map((r) => r.name)).to.not.include.members(['fraxtal-mainnet', 'manta-mainnet'])
        })
    })

    describe('validChains', () => {
        beforeEach(() => {
            setStage(Stage.MAINNET)
        })

        const validChains = ['ethereum-mainnet', 'arbitrum-mainnet', 'optimism-mainnet', 'base-mainnet']
        const invalidChains = ['invalid-chain-1', 'invalid-chain-2']

        it('should return if a chain is valid (valid chain)', () => {
            const result = isValidChain('ethereum-mainnet')

            expect(result).to.be.true
        })

        it('should return if a chain is valid (invalid chain)', () => {
            const result = isValidChain('invalid-chain-1')

            expect(result).to.be.false
        })

        it('should not revert if all chains are valid', () => {
            const supportedChains = validChains
            expect(() => validateChains(validChains, supportedChains)).to.not.throw()
        })

        it('should not revert if all chains are valid and supported', () => {
            const supportedChains = validChains
            expect(() => validateChains(validChains, supportedChains)).to.not.throw()
        })

        it('should throw if a chain is invalid', () => {
            const supportedChains = validChains

            expect(() => validateChains(invalidChains, validChains)).to.throw(`Invalid chain: ${invalidChains[0]}`)
        })
    })

    describe('tokenNames', () => {
        it('should return the token name (valid token name)', () => {
            const result = getTokenName('usdt')

            expect(result).to.equal(TokenName.USDT)
        })

        it('should throw if a token name is invalid', () => {
            const invalidTokenName = 'invalid-token-1'
            expect(() => getTokenName(invalidTokenName)).to.throw(`Token ${invalidTokenName} not found`)
        })

        it('should return the reward token name (valid reward token name)', () => {
            const result = getRewardTokenName('lle')

            expect(result).to.equal(RewardTokenName.LLE)
        })

        it('should throw if a reward token name is invalid', () => {
            const invalidRewardTokenName = 'invalid-reward-token-1'
            expect(() => getRewardTokenName(invalidRewardTokenName)).to.throw(
                `Reward Token ${invalidRewardTokenName} not found`
            )
        })
    })

    describe('getSupportedTokensByEid', () => {
        beforeEach(() => {
            setStage(Stage.MAINNET)
        })

        it('should return the supported tokens by eid (chain with tokens)', () => {
            const result = getSupportedTokensByEid(EndpointId.ETHEREUM_V2_MAINNET)

            expect(result.length).to.equal(5)
            expect(result).to.have.members([
                TokenName.USDT,
                TokenName.USDC,
                TokenName.ETH,
                TokenName.METIS,
                TokenName.mETH,
            ])
        })

        it('should return the supported tokens by eid (chain without tokens)', () => {
            const result = getSupportedTokensByEid(EndpointId.ETHERLINK_V2_MAINNET)

            expect(result.length).to.equal(0)
            expect(result).to.have.members([])
        })

        it('should return an empty array if the eid is invalid', () => {
            const result = getSupportedTokensByEid(90 as EndpointId)

            expect(result.length).to.equal(0)
            expect(result).to.have.members([])
        })
    })

    describe('setStage', () => {
        it('should set the stage', () => {
            setStage(Stage.MAINNET)

            const currentStage = requireStage()

            expect(currentStage).to.equal(Stage.MAINNET)
        })

        it('should throw if the stage is not set', () => {
            expect(() => requireStage()).to.throw('Stage not set. Call setStage(stage) before using chain utils.')
        })
        it('should throw if the stage is invalid', () => {
            const invalidStage = 'invalid-stage' as Stage

            expect(() => setStage(invalidStage)).to.throw(`Invalid stage: ${invalidStage}`)
        })
    })
})

function getChainsEID() {
    const supportedChains = getAllChainsConfig()
    const mapping = supportedChains.reduce<Record<string, EndpointId>>((acc, chain) => {
        acc[chain.name] = chain.eid
        return acc
    }, {})
    return mapping
}
