import { pluralizeNoun } from '@layerzerolabs/io-devtools'

import type { OmniTransaction } from '@layerzerolabs/devtools'

/**
 * Helper that returns a pluralized message about the number of transactions
 * needed to configure something
 *
 * ```
 * console.log(formatNumberOfTransactions([])) // 0 transactions needed
 * ```
 *
 * @param {OmniTransaction[]} transactions
 * @returns {string}
 */
export const formatNumberOfTransactions = (transactions: OmniTransaction[]): string =>
    pluralizeNoun(transactions.length, '1 transaction needed', `${transactions.length} transactions needed`)
