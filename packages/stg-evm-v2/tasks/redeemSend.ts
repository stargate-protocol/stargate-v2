import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { makeBytes32 } from '@layerzerolabs/devtools'
import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'

import { getStargateDeployName } from '../ops/util'
import { ERC20Token, StargatePool } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { Network } from '@layerzerolabs/lz-definitions'
import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    dstNetwork: string
    lpAmount: string
    sender: string
    token: TokenName
}

const action: ActionType<TaskArgs> = async ({ dstNetwork, lpAmount, sender: senderArgument, token }, hre) => {
    const network = hre.network.name as Network
    const eid = getEidForNetworkName(network)
    const type = getAssetType(eid, token)

    const signer = await hre.getNamedAccounts().then(getNamedAccount(senderArgument))
    const sender = await hre.ethers.getSigner(signer)
    console.log(`Sender: ${sender.address}`)
    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    const stargateAddress = stargateDeployment.address
    const stargate = (await hre.ethers.getContractAt(stargateDeployment.abi, stargateAddress)) as StargatePool
    const dstEid = getEidForNetworkName(dstNetwork)
    const lpTokenAddress = await stargate.lpToken()
    const lpToken = (await hre.ethers.getContractAt('LPToken', lpTokenAddress)) as ERC20Token
    const decimals = await lpToken.decimals()
    const amount = ethers.utils.parseUnits(lpAmount, decimals).toString()
    const slippage = 100
    const minAmount = ethers.utils
        .parseUnits(lpAmount ?? '0', decimals)
        .mul(10000 - slippage)
        .div(10000)
        .toString()
    console.log('amount', amount, 'minAmount', minAmount)
    const redeemParams = {
        dstEid,
        to: ethers.utils.hexlify(makeBytes32(sender.address)),
        amountLD: amount,
        minAmountLD: minAmount,
        extraOptions: ethers.utils.arrayify('0x'),
        composeMsg: ethers.utils.arrayify('0x'),
        oftCmd: ethers.utils.arrayify('0x'),
    }
    const [nativeFee, lzTokenFee] = await stargate.quoteRedeemSend(redeemParams, false)
    console.log(
        `native fee: ${ethers.utils.formatEther(nativeFee)} lz token fee: ${ethers.utils.formatUnits(lzTokenFee, decimals)}`
    )
    const gasPrice = await hre.ethers.provider.getGasPrice()
    const receipt = await (
        await stargate.connect(sender).redeemSend(redeemParams, { nativeFee, lzTokenFee }, sender.address, {
            value: nativeFee.toString(),
            gasPrice,
        })
    ).wait()
    console.log(`Stargate.redeemSend() tx hash: ${receipt.transactionHash}`)
}
task('redeemSend', 'redeem lp and Send token to another chain', action)
    .addParam('dstNetwork', 'destination network')
    .addParam('lpAmount', 'lp amount to redeemSend')
    .addParam('sender', 'sender name')
    .addParam('token', 'token name', undefined, types.token)
