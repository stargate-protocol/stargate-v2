import '@nomiclabs/hardhat-ethers'

import { expect } from 'chai'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { appendDependencies, appendTags } from '../../ts-src/utils/helpers'

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
})
