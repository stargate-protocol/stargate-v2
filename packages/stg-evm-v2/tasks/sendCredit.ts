import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointVersion, Network, networkToEndpointId } from '@layerzerolabs/lz-definitions'

import { getStargateDeployName } from '../ops/util'
import { CreditMessaging, StargateBase } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    dstNetwork: string
    amount: string
    token: TokenName
}

const action: ActionType<TaskArgs> = async ({ dstNetwork, amount: amountArgument, token }, hre) => {
    const network = hre.network.name as Network
    const eid = getEidForNetworkName(network)
    const type = getAssetType(eid, token)

    if (type === StargateType.Oft) {
        console.log('OFT does not need to sendCredit')
        return
    }

    const signer = await hre.getNamedAccounts().then(getNamedAccount('planner'))
    const planner = await hre.ethers.getSigner(signer)
    console.log(`Sender: ${planner.address}`)
    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    const stargateAddress = stargateDeployment.address
    const stargate = (await hre.ethers.getContractAt(stargateDeployment.abi, stargateAddress)) as StargateBase
    const messagingDeployment = await hre.deployments.get('CreditMessaging')
    const messaging = (await hre.ethers.getContractAt(
        'CreditMessaging',
        messagingDeployment.address
    )) as CreditMessaging
    const srcEid = networkToEndpointId(network, EndpointVersion.V2)
    const dstEid = networkToEndpointId(dstNetwork, EndpointVersion.V2)
    const decimals = await stargate.sharedDecimals()
    const amount = ethers.utils.parseUnits(amountArgument, decimals).toString()
    const assetId = await messaging.assetIds(stargateAddress)
    const [nativeFee, lzTokenFee] = await messaging.quoteSendCredits(dstEid, [
        {
            assetId,
            credits: [
                {
                    srcEid,
                    amount,
                    minAmount: 0,
                },
            ],
        },
    ])
    console.log(
        `native fee: ${ethers.utils.formatEther(nativeFee)} lz token fee: ${ethers.utils.formatUnits(lzTokenFee, decimals)}`
    )
    const gasPrice = await hre.ethers.provider.getGasPrice()
    const receipt = await messaging
        .connect(planner)
        .sendCredits(
            dstEid,
            [
                {
                    assetId,
                    credits: [
                        {
                            srcEid,
                            amount,
                            minAmount: 0,
                        },
                    ],
                },
            ],
            { value: nativeFee.toString(), gasPrice }
        )
        .then((tx) => tx.wait())

    console.log(`Messaging.sendCredit() tx hash: ${receipt.transactionHash}`)
}
task('sendCredit', 'send token/lp to another chain', action)
    .addParam('dstNetwork', 'destination network')
    .addParam('amount', 'amount to send')
    .addParam('token', 'token name', undefined, types.token)
