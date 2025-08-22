import { parallelProcess, parse } from '../common-utils'

import { getBalancingQuoteState } from './balancingQuoteState'
import { getBusNativeDropsState } from './busNativeDropsState'
import { getFeeConfigsState } from './feeConfigsState'
import { getPlannerNativeBalanceState } from './plannerNativeBalanceState'
import { getPlannerPermissionsState } from './plannerPermissionsState'
import { getQuotesState } from './quotesState'
import { errorString, timeoutString } from './utils'

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

const main = async () => {
    const numConcurrentChecks = 3

    const [
        feeConfigsState,
        plannerPermissionsState,
        busNativeDropsState,
        balancingQuoteState,
        quotesState,
        plannerNativeBalanceState,
    ] = (await parallelProcess<any>(
        [
            // These checks validate that the contracts are configured correctly on-chain
            () => getFeeConfigsState(args),
            () => getPlannerPermissionsState(args),
            () => getBusNativeDropsState(args),
            () => getBalancingQuoteState(args),
            () => getQuotesState(args),
            () => getPlannerNativeBalanceState(args),
        ],
        numConcurrentChecks
    )) as [
        ReturnType<typeof getFeeConfigsState>,
        ReturnType<typeof getPlannerPermissionsState>,
        ReturnType<typeof getBusNativeDropsState>,
        ReturnType<typeof getBalancingQuoteState>,
        ReturnType<typeof getQuotesState>,
        ReturnType<typeof getPlannerNativeBalanceState>,
    ]

    const errorsOnlyObject = getErrorOnlyObject({
        balancingQuoteState,
        feeConfigsState,
        busNativeDropsState,
        quotesState,
        plannerPermissionsState,
        plannerNativeBalanceState,
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
