import { describe, it } from 'node:test'

import { expect } from 'chai'
import sinon from 'sinon'

import { getUSDTAddress } from '../src/utils'

// Mock data for testing
const validUsdtData = {
    proxies: [
        { address: '0x1234567890abcdef1234567890abcdef12345678' },
        { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef' },
    ],
}

const noProxiesUsdtData = {
    proxies: [],
}

const missingProxiesUsdtData = {}

describe('getUSDTAddress', () => {
    it('should return the last proxy address when proxies exist', () => {
        const address = getUSDTAddress(validUsdtData)
        expect(address).to.equal('0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef')
    })

    it('should return an empty string when no proxies exist', () => {
        const address = getUSDTAddress(noProxiesUsdtData)
        expect(address).to.equal('')
    })

    it('should return an empty string when proxies are missing', () => {
        const address = getUSDTAddress(missingProxiesUsdtData)
        expect(address).to.equal('')
    })

    it('should handle an undefined or null input gracefully', () => {
        expect(() => getUSDTAddress(undefined)).not.to.throw()
        expect(() => getUSDTAddress(null)).not.to.throw()
    })

    it('should return an empty string if the last proxy address is undefined', () => {
        const undefinedProxyUsdtData = {
            proxies: [{ address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef' }, { address: undefined }],
        }
        const address = getUSDTAddress(undefinedProxyUsdtData)
        expect(address).to.equal('')
    })

    it('should log a warning message if no proxies are found', () => {
        const consoleSpy = sinon.spy(console, 'log')
        getUSDTAddress(noProxiesUsdtData)
        expect(consoleSpy.calledWith(`No proxies found in ${JSON.stringify(noProxiesUsdtData)}`)).to.be.true
        consoleSpy.restore()
    })

    it('should log an error if something goes wrong', () => {
        const consoleErrorSpy = sinon.spy(console, 'error')

        const invalidData = null
        getUSDTAddress(invalidData)

        expect(consoleErrorSpy.called).to.be.true

        consoleErrorSpy.restore()
    })
})
