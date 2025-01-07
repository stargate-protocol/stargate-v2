import { parse } from '@monorepo/args'
import { parallelProcess } from '@monorepo/common-utils'

import { getBalancingQuoteState } from './balancingQuoteState'
import { getBusNativeDropsState } from './busNativeDropsState'
import { getFeeConfigsState } from './feeConfigsState'
import { getPriceState } from './getPriceState'
import { getPlannerNativeBalanceState } from './plannerNativeBalanceState'
import { getPlannerPermissionsState } from './plannerPermissionsState'
import { getQuotesState } from './quotesState'
import {
    ByAssetConfig,
    ByAssetPathConfig,
    ByChainConfig,
    errorString,
    timeoutString,
} from './utils'

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
    },
})

const getErrorOnlyObject = (obj: any): any => {
    return Object.fromEntries(
        Object.entries(obj)
            .map(([key, value]) => {
                if (typeof value === 'object') {
                    return [key, getErrorOnlyObject(value)]
                }

                if (
                    typeof value === 'string' &&
                    (value.includes(errorString) ||
                        value.includes(timeoutString))
                ) {
                    return [key, value]
                }

                return null
            })
            .filter((entry): entry is [string, any] => {
                if (!entry) {
                    return false
                }

                if (
                    typeof entry[1] === 'object' &&
                    Object.keys(entry[1]).length === 0
                ) {
                    return false
                }

                return true
            }),
    )
}

const main = async () => {
    let balancingQuoteState: ByAssetPathConfig = {}
    let feeConfigsState: ByAssetPathConfig = {}
    let quotesState: ByAssetPathConfig = {}
    let busNativeDropsState: ByAssetPathConfig = {}
    let priceState: ByAssetConfig = {}
    let plannerPermissionsState: ByAssetConfig = {}
    let plannerNativeBalanceState: ByChainConfig = {}

    await parallelProcess(
        [
            async () => {
                balancingQuoteState = await getBalancingQuoteState(args)
            },
            async () => {
                feeConfigsState = await getFeeConfigsState(args)
            },
            async () => {
                plannerPermissionsState = await getPlannerPermissionsState(args)
            },
            async () => {
                busNativeDropsState = await getBusNativeDropsState(args)
            },
            async () => {
                quotesState = await getQuotesState(args)
            },
            async () => {
                priceState = await getPriceState(args)
            },
            async () => {
                plannerNativeBalanceState = await getPlannerNativeBalanceState(
                    args,
                )
            },
        ],
        2,
    )

    const errorsOnlyObject = getErrorOnlyObject({
        balancingQuoteState,
        feeConfigsState,
        busNativeDropsState,
        quotesState,
        priceState,
        plannerPermissionsState,
        plannerNativeBalanceState,
    })

    console.log('\n\n')

    if (Object.keys(errorsOnlyObject).length) {
        console.log(JSON.stringify(errorsOnlyObject, null, 2))
        console.log(
            '⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️ Errors found in deployment state ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️',
        )

        return
    }

    console.log(
        '🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 No errors found in deployment state 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢',
    )
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
