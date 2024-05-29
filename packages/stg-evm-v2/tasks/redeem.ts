import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Network } from '@layerzerolabs/lz-definitions'

import { getStargateDeployName } from '../ops/util'
import { ERC20Token, StargatePool } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    amount: string
    receiver: string
    token: TokenName
}

const action: ActionType<TaskArgs> = async ({ amount: amountArgument, receiver, token }, hre) => {
    const network = hre.network.name as Network
    const eid = getEidForNetworkName(network)
    const type = getAssetType(eid, token)

    if (type === StargateType.Oft) {
        console.error(`OFT does not support redeem`)
    }

    const signer = await hre.getNamedAccounts().then(getNamedAccount(receiver))
    const user = await hre.ethers.getSigner(signer)
    console.log(`Receiver: ${user.address}`)

    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    if (!stargateDeployment) {
        console.log(`StargatePool not deployed in ${network}`)
        return
    }
    const stargateAddress = stargateDeployment.address
    const stargate = (await hre.ethers.getContractAt(stargateDeployment.abi, stargateAddress)) as StargatePool
    const lpTokenAddress = await stargate.lpToken()
    const lpToken = (await hre.ethers.getContractAt('LPToken', lpTokenAddress)) as ERC20Token
    let lpBalance = await lpToken.balanceOf(user.address)
    const decimals = await lpToken.decimals()
    const amount = ethers.utils.parseUnits(amountArgument, decimals).toString()
    console.log(`TVL before redeem: ${ethers.utils.formatUnits(await lpToken.totalSupply(), decimals)}`)
    console.log(`User LP balance before redeem: ${ethers.utils.formatUnits(lpBalance, decimals)}`)

    console.log(`redeem ${amount} from ${stargateAddress} to ${user.address}`)
    const gasPrice = await hre.ethers.provider.getGasPrice()
    const receipt = await (await stargate.connect(user).redeem(amount, user.address, { gasPrice })).wait()
    console.log(`Stargate.redeem() tx hash: ${receipt.transactionHash}`)
    console.log(`TVL after redeem: ${ethers.utils.formatUnits(await lpToken.totalSupply(), decimals)}`)
    lpBalance = await lpToken.balanceOf(user.address)
    console.log(`User LP balance after redeem: ${ethers.utils.formatUnits(lpBalance, decimals)}`)
}
task('redeem', 'redeem token from pool', action)
    .addParam('amount', 'amount to deposit')
    .addParam('receiver', 'receiver name')
    .addParam('token', 'token name', undefined, types.token)
