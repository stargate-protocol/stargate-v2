import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Network } from '@layerzerolabs/lz-definitions'

import { getStargateDeployName } from '../ops/util'
import { ERC20Token, StargateBase } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    token: TokenName
    sender: string
    receiver: string
    amount: string
}

const action: ActionType<TaskArgs> = async (taskArgs, hre) => {
    const token = taskArgs.token
    const network = hre.network.name as Network
    const eid = getEidForNetworkName(network)
    const type = getAssetType(eid, token)

    const signer = await hre.getNamedAccounts().then(getNamedAccount(taskArgs.sender))
    const sender = await hre.ethers.getSigner(signer)
    console.log(`Sender: ${sender.address}`)

    const to = taskArgs.receiver
    console.log(`Receiver: ${to}`)
    if (type === StargateType.Native) {
        const amount = ethers.utils.parseEther(taskArgs.amount).toString()
        const beforeBalance = await hre.ethers.provider.getBalance(to)
        console.log(`Receiver balance before transfer: ${ethers.utils.formatEther(beforeBalance)}`)
        await sender.sendTransaction({ value: amount, to: to }).then((tx) => tx.wait())
        const afterBalance = await hre.ethers.provider.getBalance(to)
        console.log(`Receiver balance after transfer: ${ethers.utils.formatEther(afterBalance)}`)
    } else {
        const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
        const stargateAddress = stargateDeployment.address
        const stargate = (await hre.ethers.getContractAt(stargateDeployment.abi, stargateAddress)) as StargateBase
        const tokenAddress = await stargate.token()
        const tokenContract = (await hre.ethers.getContractAt('ERC20', tokenAddress)) as ERC20Token
        const decimals = await tokenContract.decimals()
        const amount = ethers.utils.parseUnits(taskArgs.amount, decimals).toString()
        const beforeBalance = await tokenContract.balanceOf(to)
        console.log(`Receiver balance before transfer: ${ethers.utils.formatUnits(beforeBalance, decimals)}`)
        await (await tokenContract.connect(sender).transfer(to, amount)).wait()
        const afterBalance = await tokenContract.balanceOf(to)
        console.log(`Receiver balance after transfer: ${ethers.utils.formatUnits(afterBalance, decimals)}`)
    }
}

task('transfer', 'Transfer tokens', action)
    .addParam('token', 'token name', undefined, types.token)
    .addParam('sender', 'sender name')
    .addParam('receiver', 'receiver address')
    .addParam('amount', 'amount to transfer')
