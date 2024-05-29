import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'

import { getTokenDeployName } from '../ops/util'
import { ERC20Token } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    sender: string
    token: TokenName
}

const action: ActionType<TaskArgs> = async ({ sender, token }, hre) => {
    const signer = await hre.getNamedAccounts().then(getNamedAccount(sender))
    const user = await hre.ethers.getSigner(signer)
    const eid = getEidForNetworkName(hre.network.name)
    const type = getAssetType(eid, token)

    console.log(`User: ${user.address}`)
    console.log(`Native Token Balance: ${ethers.utils.formatEther(await user.getBalance())}`)
    if (type === StargateType.Native) {
        return
    }
    const tokenDeployName = getTokenDeployName(token, type)
    const tokenDeployment = await hre.deployments.get(tokenDeployName)
    const tokenAddress = tokenDeployment.address
    const tokenContract = (await hre.ethers.getContractAt(tokenDeployment.abi, tokenAddress)) as ERC20Token
    const balance = await tokenContract.balanceOf(user.address)
    console.log(`${token} Balance: ${ethers.utils.formatUnits(balance, await tokenContract.decimals())}`)
}

task('printUser', 'print user balance', action)
    .addParam('sender', 'sender name')
    .addParam('token', 'token name', undefined, types.token)
