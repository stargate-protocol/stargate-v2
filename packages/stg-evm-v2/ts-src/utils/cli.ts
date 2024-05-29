import { TokenName, isTokenName } from '@stargatefinance/stg-definitions-v2'
import { types as builtInTypes } from 'hardhat/config'
import { HardhatError } from 'hardhat/internal/core/errors'
import { ERRORS } from 'hardhat/internal/core/errors-list'

import type { CLIArgumentType } from 'hardhat/types'

/**
 * Hardhat CLI type for a comma separated list of arbitrary strings
 */
const token: CLIArgumentType<TokenName> = {
    name: 'token',
    parse(name: string, value: string) {
        if (!isTokenName(value)) {
            throw new HardhatError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
                value,
                name: name,
                type: 'token',
            })
        }

        return value
    },
    validate() {},
}

export const types = { token, ...builtInTypes }
