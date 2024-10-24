import '@nomiclabs/hardhat-ethers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { bytecode as expectedBytecode } from './__snapshots__/FiatTokenV2_2.json'

describe('usdc/bytecode', () => {
    it('should match the Circle bytecode', async () => {
        const libraryContractFactory = await ethers.getContractFactory('SignatureChecker')
        const libraryContract = await libraryContractFactory.deploy()

        const tokenContractFactory = await ethers.getContractFactory('FiatTokenV2_2', {
            libraries: {
                SignatureChecker: libraryContract.address,
            },
        })
        // TODO get contract creation and deployed bytecode from arb mainnet then fill in $ as needed before ensuring our newly deployed bytecodes match
        const tokenContract = await tokenContractFactory.deploy()
        const bytecode = await tokenContract.provider.getCode(tokenContract.address)

        expect(bytecode).to.eql(expectedBytecode)
    })
})
