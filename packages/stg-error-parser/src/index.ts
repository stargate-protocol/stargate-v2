import { contracts } from '@stargatefinance/stg-evm-v2/deployed'

import { LayerZeroErrorParser, LayerZeroParsedError } from '@layerzerolabs/evm-sdks-core'

// We'll create a list of all the errors found in all the stargate contracts
const errorEntries = Object.values(contracts)
    // First we get one ABI per network for every contract
    .flatMap(({ abis: abisByNetworkName }) => Object.values(abisByNetworkName))
    // Then we flatten all the ABIs into one massive ABI
    .flat()
    // Then we take the error fragments out
    .filter(({ type }) => type === 'error')
    // Then we'll need to deduplicate the errors so we create a hash key by stringifying the error
    //
    // Simple yet effective
    .map((fragment) => [JSON.stringify(fragment), fragment] as const)

// Now that we have the errors in array of [hash, fragment] tuples, we can just deduplicate them
// by turning them into an object and getting all of its values
export const errors = Object.values(Object.fromEntries(errorEntries))

/**
 * This function is a wrapper for LayerZeroErrorParser.check.
 * @see {@link LayerZeroErrorParser.check}
 * @param data - The data string to check for errors.
 */
export function checkError(data: string): void {
    const parser = new LayerZeroErrorParser(errors)
    parser.check(data, checkError)
}

/**
 * This function is a wrapper for LayerZeroErrorParser.parse.
 * @see {@link LayerZeroErrorParser.parse}
 * @param data - The data string to parse for errors.
 */
export function parseError(data: string): LayerZeroParsedError | null {
    const parser = new LayerZeroErrorParser(errors)
    return parser.parse(data)
}
