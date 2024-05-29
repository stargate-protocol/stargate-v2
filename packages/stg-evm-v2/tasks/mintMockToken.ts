import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'
import { ActionType } from 'hardhat/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'

import { getStargateDeployName } from '../ops/util'
import { ERC20Token, StargateBase } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

interface TaskArgs {
    amount: string
    minter: string
    token: TokenName
}

const action: ActionType<TaskArgs> = async (taskArgs, hre) => {
    const token = taskArgs.token
    const eid = getEidForNetworkName(hre.network.name)
    const type = getAssetType(eid, token)

    const signer = await hre.getNamedAccounts().then(getNamedAccount(taskArgs.minter))
    const user = await hre.ethers.getSigner(signer)
    console.log(`Minter: ${user.address}`)

    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    const stargateAddress = stargateDeployment.address
    const stargate = (await hre.ethers.getContractAt(stargateDeployment.abi, stargateAddress)) as StargateBase
    const tokenAddress = await stargate.token()
    if (tokenAddress === ethers.constants.AddressZero) {
        console.log('native token')
        return
    }
    // const tokenDeployment = await hre.deployments.get(getTokenDeployName(token, type))
    const tokenContract = (await hre.ethers.getContractAt('ERC20Token', tokenAddress)) as ERC20Token
    const decimals = await tokenContract.decimals()
    const amount = ethers.utils.parseUnits(taskArgs.amount, decimals).toString()
    console.log(`minting ${ethers.utils.formatUnits(amount, decimals)} ${token} to ${user.address}`)
    const gasPrice = await hre.ethers.provider.getGasPrice()
    const receipt = await tokenContract
        .connect(user)
        .mint(user.address, amount, { gasPrice })
        .then((tx) => tx.wait())
    console.log(`ERC20Token.mint() tx hash: ${receipt.transactionHash}`)
    console.log(
        `ERC20Token balance: ${ethers.utils.formatUnits(await tokenContract.balanceOf(user.address), decimals)}`
    )
}

task('mintMockToken', 'mint mock erc20 token', action)
    .addParam('amount', 'amount to deposit')
    .addParam('minter', 'minter name')
    .addParam('token', 'token name', undefined, types.token)
