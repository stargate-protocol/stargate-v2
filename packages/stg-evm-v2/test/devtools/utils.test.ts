import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { Asset } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import sinon from 'sinon'

import { assertHardhatDeploy, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

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
})
