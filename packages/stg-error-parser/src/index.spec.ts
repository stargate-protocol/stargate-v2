import assert from 'assert'

import { parseError } from '.'

describe(parseError.name, () => {
    it('parses a custom stargate error', () => {
        const err = '0x7c75c3d2'
        const parsed = parseError(err)
        assert(parsed?.message === 'Transfer_TransferFailed')
    })
})
