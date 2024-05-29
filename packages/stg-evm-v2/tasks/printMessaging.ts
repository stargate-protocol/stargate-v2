import { ethers } from 'ethers'
import { task } from 'hardhat/config'
import { ActionType, HardhatRuntimeEnvironment } from 'hardhat/types'

import {
    Chain,
    EndpointVersion,
    Network,
    Stage,
    chainAndStageToEndpointId,
    endpointIdToChain,
    networkToStage,
} from '@layerzerolabs/lz-definitions'
import { addressToBytes32 } from '@layerzerolabs/lz-v2-utilities'

import { CreditMessaging, OftCmd, SEND_MODE_TAXI, StargateBase, TokenMessaging } from '../ts-src'
import { getNamedAccount } from '../ts-src/utils/util'

async function quoteTaxi(
    hre: HardhatRuntimeEnvironment,
    dstEid: number,
    assetId: number,
    tokenMessaging: TokenMessaging
) {
    const oftcmd = new OftCmd(SEND_MODE_TAXI, [])
    const stargateAddress = await tokenMessaging.stargateImpls(assetId)
    const stargate = (await hre.ethers.getContractAt('StargateBase', stargateAddress)) as StargateBase
    const signer = await hre.getNamedAccounts().then(getNamedAccount('deployer'))
    const user = await hre.ethers.getSigner(signer)
    const sendParams = {
        sender: user.address,
        dstEid,
        to: ethers.utils.hexlify(addressToBytes32(user.address)),
        amountLD: ethers.utils.parseUnits('1', 18).toString(),
        minAmountLD: 0,
        extraOptions: ethers.utils.arrayify('0x'),
        composeMsg: ethers.utils.arrayify('0x'),
        oftCmd: oftcmd.toBytes(),
    }
    const messagingFee = await stargate.quoteSend(sendParams, false)
    return messagingFee.nativeFee
}

async function quoteBaseBusFare(dstEid: number, tokenMessaging: TokenMessaging) {
    const fare = await tokenMessaging.quoteFares(dstEid, 20)
    return fare
}

const action: ActionType<unknown> = async (_, hre) => {
    const network = hre.network.name as Network
    const creditMessagingDeployment = await hre.deployments.get('CreditMessaging')
    const creditMessaging = (await hre.ethers.getContractAt(
        creditMessagingDeployment.abi,
        creditMessagingDeployment.address
    )) as CreditMessaging
    const tokenMessagingDeployment = await hre.deployments.get('TokenMessaging')
    const tokenMessaging = (await hre.ethers.getContractAt(
        tokenMessagingDeployment.abi,
        tokenMessagingDeployment.address
    )) as TokenMessaging
    const stage = networkToStage(network)
    const chains =
        stage === Stage.SANDBOX
            ? [Chain.ETHEREUM, Chain.POLYGON, Chain.BSC]
            : [Chain.ETHEREUM, Chain.POLYGON, Chain.BSC, Chain.AVALANCHE, Chain.SEPOLIA, Chain.ARBSEP]
    const endponts = chains.map((chain) => chainAndStageToEndpointId(chain, stage, EndpointVersion.V2))
    console.log(`======================= Credit Messaging =======================`)
    console.log(`Planner: ${await creditMessaging.planner()}`)
    console.log(`Owner: ${await creditMessaging.owner()}`)
    for (const eid of endponts) {
        console.log(`GasLimit=>${endpointIdToChain(eid)}(${eid}): ${await creditMessaging.gasLimits(eid)}`)
    }
    console.log(`======================= Token Messaging =======================`)
    console.log(`Planner: ${await tokenMessaging.planner()}`)
    console.log(`Owner: ${await tokenMessaging.owner()}`)
    for (const eid of endponts) {
        const { maxNumPassengers, busFare, qLength, nextTicketId } = await tokenMessaging.busQueues(eid)
        console.log(
            `BusQueue=>${endpointIdToChain(eid)}(${eid}): maxNumPassengers: ${maxNumPassengers} busFare: ${busFare} qLength: ${qLength} nextTicketId: ${nextTicketId}`
        )
        console.log(`nativeDropAmount: ${await tokenMessaging.nativeDropAmounts(eid)}`)
        console.log(`taxiFee: ${await quoteTaxi(hre, eid, 1, tokenMessaging)}`)
        console.log(`busFare: ${await quoteBaseBusFare(eid, tokenMessaging)}`)
        console.log(`GasLimit=>${endpointIdToChain(eid)}(${eid}): ${await tokenMessaging.gasLimits(eid)}`)
    }
}

task('printMessaging', 'print messaging info', action)
