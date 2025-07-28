import { parallelProcess } from '../common-utils'

import { getBalancingQuoteState } from './balancingQuoteState'
import { getBusNativeDropsState } from './busNativeDropsState'
import { getFeeConfigsState } from './feeConfigsState'
import { getPlannerPermissionsState } from './plannerPermissionsState'
import { getQuotesState } from './quotesState'
import { errorString, parse, timeoutString } from './utils'

const args = parse({
    header: 'Check Deployment State',
    description: 'Check Deployment State',
    args: {
        environment: {
            alias: 'e',
            type: String,
            defaultValue: 'mainnet',
            description: 'the environment',
        },
        only: {
            alias: 'o',
            type: String,
            defaultValue: '',
            description: 'chain name to check',
        },
        targets: {
            alias: 't',
            type: String,
            defaultValue: '',
            description: 'new chain names to check against',
        },
        runContractChecks: {
            type: Boolean,
            defaultValue: true,
            description: 'run checks to verify that the contracts are configured correctly on-chain',
        },
        runOffchainChecks: {
            type: Boolean,
            defaultValue: true,
            description: 'run checks to verify that the offchain configuration is correct',
        },
        numRetries: {
            alias: 'r',
            type: Number,
            defaultValue: 3,
            description: 'Number of retries for RPC calls before giving up',
        },
    },
})

const getErrorOnlyObject = (obj: any): any => {
    return Object.fromEntries(
        Object.entries(obj)
            .map(([key, value]) => {
                if (typeof value === 'object') {
                    return [key, getErrorOnlyObject(value)]
                }

                if (typeof value === 'string' && (value.includes(errorString) || value.includes(timeoutString))) {
                    return [key, value]
                }

                return null
            })
            .filter((entry): entry is [string, any] => {
                if (!entry) {
                    return false
                }

                if (typeof entry[1] === 'object' && Object.keys(entry[1]).length === 0) {
                    return false
                }

                return true
            })
    )
}

/**
 * Builds a callback that resolves to an empty object if the shouldRun flag is false.
 * Otherwise, it returns the check function itself.
 */
const buildCallback = <T>({ check, shouldRun }: { check: () => T; shouldRun: boolean }): (() => T) => {
    return shouldRun ? check : () => Promise.resolve({}) as T
}

const main = async () => {
    const numConcurrentChecks = 3

    const [feeConfigsState, plannerPermissionsState, busNativeDropsState, balancingQuoteState, quotesState] =
        (await parallelProcess<any>(
            [
                // These checks validate that the contracts are configured correctly on-chain
                buildCallback({
                    check: () => getFeeConfigsState(args),
                    shouldRun: args.runContractChecks,
                }),
                buildCallback({
                    check: () => getPlannerPermissionsState(args),
                    shouldRun: args.runContractChecks,
                }),
                buildCallback({
                    check: () => getBusNativeDropsState(args),
                    shouldRun: args.runContractChecks,
                }),
                buildCallback({
                    check: () => getBalancingQuoteState(args),
                    shouldRun: args.runContractChecks,
                }),
                buildCallback({
                    check: () => getQuotesState(args),
                    shouldRun: args.runContractChecks,
                }),
            ],
            numConcurrentChecks
        )) as [
            ReturnType<typeof getFeeConfigsState>,
            ReturnType<typeof getPlannerPermissionsState>,
            ReturnType<typeof getBusNativeDropsState>,
            ReturnType<typeof getBalancingQuoteState>,
            ReturnType<typeof getQuotesState>,
        ]

    const errorsOnlyObject = getErrorOnlyObject({
        balancingQuoteState,
        feeConfigsState,
        busNativeDropsState,
        quotesState,
        plannerPermissionsState,
    })

    console.log('\n\n')

    if (Object.keys(errorsOnlyObject).length) {
        console.log(JSON.stringify(errorsOnlyObject, null, 2))
        console.log(
            '⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️ Errors found in deployment state ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️'
        )

        return
    }

    console.log(
        '🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 No errors found in deployment state 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢'
    )
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
