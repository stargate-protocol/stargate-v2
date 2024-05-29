import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'

import { getStargateDeployName } from '../ops/util'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { TokenName } from '@stargatefinance/stg-definitions-v2'
import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    amount: string
    token: TokenName
}

const action: ActionType<TaskArgs> = async ({ token, amount: amountArgument }, hre) => {
    // The tasks need to import the TypeChain types dynamically
    // otherwise we end up in a chicken-egg scenario where compile will error out
    // since the TypeChain is not there but TypeChain needs compile
    const { StargatePool__factory } = await import('../ts-src/typechain-types')

    const planner = await hre.getNamedAccounts().then(getNamedAccount('planner'))
    const sender = await hre.ethers.getSigner(planner)
    const eid = getEidForNetworkName(hre.network.name)
    const type = getAssetType(eid, token)

    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    const stargateAddress = stargateDeployment.address
    const stargate = StargatePool__factory.connect(stargateDeployment.address, sender)
    const tokenAddress = await stargate.token()

    console.log(`Found token address for ${token}: ${tokenAddress}`)

    const isNative = tokenAddress === ethers.constants.AddressZero

    let decimals = 18
    let value = '0'
    let amount

    if (isNative) {
        value = ethers.utils.parseEther(amountArgument).toString()
        amount = value
    } else {
        const { ERC20Token__factory } = await import('../ts-src/typechain-types')
        const token = ERC20Token__factory.connect(tokenAddress, sender)

        decimals = await token.decimals()
        amount = ethers.utils.parseUnits(amountArgument, decimals).toString()
        await (await token.connect(sender).approve(stargateAddress, amount)).wait()
    }

    const receipt = await (await stargate.connect(sender).addTreasuryFee(amount, { value })).wait()
    console.log(`Stargate.addTreasuryFee() tx hash: ${receipt.transactionHash}`)
}

task('addTreasuryFee', 'redeem token from pool', action)
    .addParam('amount', 'amount to add', undefined, types.string)
    .addParam('token', 'token name', undefined, types.token)
