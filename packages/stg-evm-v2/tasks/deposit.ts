import { StargateType } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'

import { getStargateDeployName } from '../ops/util'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { Network } from '@layerzerolabs/lz-definitions'
import type { TokenName } from '@stargatefinance/stg-definitions-v2'
import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    amount: string
    token: TokenName
    sender: string
}

const action: ActionType<TaskArgs> = async ({ amount, token, sender }, hre) => {
    const network = hre.network.name as Network
    const signer = await hre.getNamedAccounts().then(getNamedAccount(sender))
    const user = await hre.ethers.getSigner(signer)
    console.log(`Sender: ${user.address}`)

    const eid = getEidForNetworkName(hre.network.name)
    const type = getAssetType(eid, token)

    if (type === StargateType.Oft) {
        console.log('OFT does not support deposit')
        return
    }

    // The tasks need to import the TypeChain types dynamically
    // otherwise we end up in a chicken-egg scenario where compile will error out
    // since the TypeChain is not there but TypeChain needs compile
    const { StargatePool__factory } = await import('../ts-src/typechain-types')

    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    if (!stargateDeployment) {
        console.log(`StargatePool not deployed in ${network}`)
        return
    }
    const stargateAddress = stargateDeployment.address
    const stargate = StargatePool__factory.connect(stargateDeployment.address, user)
    const tokenAddress = await stargate.token()
    const isNative = type === StargateType.Native
    const decimals = 18
    let parsedAmount = ethers.utils.parseUnits(amount, decimals).toString()
    const value = isNative ? parsedAmount : '0'
    const gasPrice = await hre.ethers.provider.getGasPrice()
    if (isNative) {
        const nativeBalance = await user.getBalance()
        console.log(`native balance: ${ethers.utils.formatUnits(nativeBalance, decimals)}`)
    } else {
        const { ERC20Token__factory } = await import('../ts-src/typechain-types')
        const token = ERC20Token__factory.connect(tokenAddress, user)

        const decimals = await token.decimals()
        const balance = await token.balanceOf(user.address)
        console.log(
            `token: ${tokenAddress} balance: ${ethers.utils.formatUnits(balance, decimals)} native balance: ${ethers.utils.formatEther(
                await user.getBalance()
            )}`
        )
        const allowance = await token.allowance(user.address, stargateAddress)
        console.log(`allowance of ${stargateAddress}: ${ethers.utils.formatUnits(allowance)}`)
        if (allowance.lt(balance)) {
            await token
                .connect(user)
                .approve(stargateAddress, ethers.constants.MaxUint256, { gasPrice })
                .then((tx) => tx.wait())
        }
        parsedAmount = ethers.utils.parseUnits(amount, decimals).toString()
    }
    console.log(`deposit ${parsedAmount} to ${stargateAddress}`)
    const receipt = await stargate
        .connect(user)
        .deposit(user.address, parsedAmount, { value, gasPrice })
        .then((tx) => tx.wait())
    console.log(`Stargate.deposit() tx hash: ${receipt.transactionHash}`)
}

task('deposit', 'deposit token to pool', action)
    .addParam('amount', 'amount to deposit')
    .addParam('sender', 'sender name')
    .addParam('token', 'token name', undefined, types.token)
