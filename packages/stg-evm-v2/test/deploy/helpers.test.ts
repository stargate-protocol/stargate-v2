import '@nomiclabs/hardhat-ethers'

import { expect } from 'chai'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { appendDependencies, appendTags, fillAddress } from '../../ts-src/utils/helpers'

describe('deploy/helpers', () => {
    describe('appendTags', () => {
        it('should set tags if not defined', () => {
            const tags = ['tag', 'yet-another-tag']
            const deploy: DeployFunction = async () => undefined
            const appended = appendTags(tags)(deploy)

            expect(appended.tags).to.eql(tags)
        })

        it('should append tags if defined', () => {
            const existingTags = ['i-was-here-first', 'me-too']
            const deploy: DeployFunction = async () => undefined
            deploy.tags = existingTags

            const tags = ['tag', 'yet-another-tag']
            const appended = appendTags(tags)(deploy)

            expect(appended.tags).to.eql([...existingTags, ...tags])
        })
    })

    describe('appendDependencies', () => {
        it('should set dependencies if not defined', () => {
            const dependencies = ['dependency', 'yet-another-dependency']
            const deploy: DeployFunction = async () => undefined
            const appended = appendDependencies(dependencies)(deploy)

            expect(appended.dependencies).to.eql(dependencies)
        })

        it('should append dependencies if defined', () => {
            const existingDependencies = ['i-was-here-first', 'me-too']
            const deploy: DeployFunction = async () => undefined
            deploy.dependencies = existingDependencies

            const dependencies = ['dependency', 'yet-another-dependency']
            const appended = appendDependencies(dependencies)(deploy)

            expect(appended.dependencies).to.eql([...existingDependencies, ...dependencies])
        })
    })

    describe('fillAddress', () => {
        it('should replace $ with a valid address', () => {
            const bytecode = '600a600c600$600e600f'
            const address = '0x1234567890abcdef1234567890abcdef12345678'
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql('600a600c6001234567890abcdef1234567890abcdef12345678600e600f')
        })

        it('should replace $ with a valid address without 0x prefix', () => {
            const bytecode = '600a600c600$600e600f'
            const address = '1234567890abcdef1234567890abcdef12345678' // No 0x prefix
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql('600a600c6001234567890abcdef1234567890abcdef12345678600e600f')
        })

        it('should throw an error if address is too short', () => {
            const bytecode = '600a600c600$600e600f'
            const shortAddress = '0x1234567890abcdef1234567890abcdef1234' // Only 36 characters

            expect(() => fillAddress(bytecode, shortAddress)).to.throw(
                `Invalid library address length ${shortAddress.slice(2)}`
            )
        })

        it('should throw an error if address is too long', () => {
            const bytecode = '600a600c600$600e600f'
            const longAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef' // Too many characters

            expect(() => fillAddress(bytecode, longAddress)).to.throw(
                `Invalid library address length ${longAddress.slice(2)}`
            )
        })

        it('should do nothing if no $ is present in the bytecode', () => {
            const bytecode = '600a600c600b600e600f'
            const address = '0x1234567890abcdef1234567890abcdef12345678'
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql(bytecode) // Bytecode remains unchanged
        })

        it('should replace multiple instances of $ with the address', () => {
            const bytecode = '600a600$600c600$600e'
            const address = '0x1234567890abcdef1234567890abcdef12345678'
            const filledBytecode = fillAddress(bytecode, address)

            expect(filledBytecode).to.eql(
                '600a6001234567890abcdef1234567890abcdef12345678600c6001234567890abcdef1234567890abcdef12345678600e'
            )
        })
    })
})
