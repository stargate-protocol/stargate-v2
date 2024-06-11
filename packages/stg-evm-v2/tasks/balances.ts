import { formatEther } from 'ethers/lib/utils'
import { task } from 'hardhat/config'

import {
    createGetHreByEid,
    createProviderFactory,
    types as devtoolsTypes,
    getEidsByNetworkName,
} from '@layerzerolabs/devtools-evm-hardhat'
import { printCrossTable } from '@layerzerolabs/io-devtools'
import { type Stage, endpointIdToStage } from '@layerzerolabs/lz-definitions'

import { getNamedAccount } from '../ts-src/utils/util'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    stage: Stage
}

const action: ActionType<TaskArgs> = async ({ stage }, hre) => {
    const eidsByNetworkName = Object.entries(getEidsByNetworkName(hre))
        // First filter the networks for which the eid is defined
        .flatMap(([networkName, eid]) => (eid == null ? [] : ([[networkName, eid]] as const)))
        // Then filter the networks on that stage
        .filter(([, eid]) => endpointIdToStage(eid) === stage)

    const getEnvironment = createGetHreByEid(hre)
    const getProvider = createProviderFactory(getEnvironment)

    const accountNames = ['deployer', 'planner', 'treasurer', 'usdcAdmin']

    const infos = await Promise.all(
        accountNames.map(async (accountName) => {
            const entries = await Promise.all(
                eidsByNetworkName.map(async ([networkName, eid]) => {
                    const env = await getEnvironment(eid)
                    const provider = await getProvider(eid)
                    const accountAddress = await env.getNamedAccounts().then(getNamedAccount(accountName))
                    const accountBalance = await provider.getBalance(accountAddress)

                    return [networkName, { address: accountAddress, balance: formatEther(accountBalance) }] as const
                })
            )

            return Object.fromEntries(entries)
        })
    )

    console.log(printCrossTable(infos, ['Network', ...accountNames]))
}

task('balances', 'List account balances', action).addParam(
    'stage',
    'Chain stage, one of mainnet, testnet, sandbox',
    undefined,
    devtoolsTypes.stage
)
