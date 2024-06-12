import { errors } from '@stargatefinance/stg-evm-sdk-v2'

import { LayerZeroErrorParser, LayerZeroParsedError } from '@layerzerolabs/evm-sdks-core'

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
