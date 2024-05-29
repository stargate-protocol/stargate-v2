import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointVersion, Network, networkToEndpointId } from '@layerzerolabs/lz-definitions'
import { Options, addressToBytes32 } from '@layerzerolabs/lz-v2-utilities'

import { getStargateDeployName } from '../ops/util'
import { ERC20Token, OftCmd, SEND_MODE_BUS, SEND_MODE_TAXI, StargateBase, TokenMessaging } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType, getNamedAccount } from '../ts-src/utils/util'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    dstNetwork: string
    amount?: string
    sender: string
    mode: string
    token: TokenName
    composeMsg?: string
    nativeDrop?: boolean
}

const action: ActionType<TaskArgs> = async (
    { dstNetwork, amount: amountArgument, sender, mode, token, composeMsg, nativeDrop: nativeDropArgument },
    hre
) => {
    const network = hre.network.name as Network
    const eid = getEidForNetworkName(network)
    const type = getAssetType(eid, token)

    const signer = await hre.getNamedAccounts().then(getNamedAccount(sender))
    const user = await hre.ethers.getSigner(signer)
    console.log(`Sender: ${user.address}`)
    const modeType = mode
    if (!['taxi', 'bus', 'drive'].includes(modeType)) {
        console.error(`invalid mode: ${modeType}, must be taxi or bus`)
        return
    }
    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    const stargateAddress = stargateDeployment.address
    const stargate = (await hre.ethers.getContractAt(stargateDeployment.abi, stargateAddress)) as StargateBase
    const dstEid = networkToEndpointId(dstNetwork, EndpointVersion.V2)
    let passengers: string[] = []
    const gasPrice = await hre.ethers.provider.getGasPrice()
    if (modeType !== 'drive') {
        const nativeDrop = nativeDropArgument
        const mode = modeType === 'bus' ? SEND_MODE_BUS : SEND_MODE_TAXI
        const tokenAddress = await stargate.token()
        const isNative = tokenAddress === ethers.constants.AddressZero
        let decimals = 18
        let amount = ethers.utils.parseUnits(amountArgument ?? '0', decimals).toString()
        const value = isNative ? amount : '0'
        if (isNative) {
            console.log(`native balance: ${ethers.utils.formatEther(await user.getBalance())}`)
        } else {
            const tokenContract = (await hre.ethers.getContractAt('ERC20Token', tokenAddress)) as ERC20Token
            decimals = await tokenContract.decimals()
            const balance = await tokenContract.balanceOf(user.address)
            console.log(
                `token: ${tokenAddress} balance: ${ethers.utils.formatUnits(balance, decimals)} eth: ${ethers.utils.formatEther(
                    await user.getBalance()
                )}`
            )
            const allowance = await tokenContract.allowance(user.address, stargateAddress)
            console.log(`allowance of ${stargateAddress}: ${ethers.utils.formatUnits(allowance, decimals)}`)
            if (allowance.lt(balance)) {
                await (
                    await tokenContract
                        .connect(user)
                        .approve(stargateAddress, ethers.constants.MaxUint256, { gasPrice })
                ).wait()
            }
            amount = ethers.utils.parseUnits(amount ?? '0', decimals).toString()
        }
        const slippage = 100
        const minAmount = ethers.utils
            .parseUnits(amount ?? '0', decimals)
            .mul(10000 - slippage)
            .div(10000)
            .toString()
        const oftCmd: OftCmd = new OftCmd(mode, passengers)
        const stargateType = await stargate.stargateType()
        console.log(`stargateType:${stargateType} stargateAddress:${stargateAddress}, oftCmd:${oftCmd.toBytes()}`)
        let extraOptions = ethers.utils.arrayify('0x')
        if (nativeDrop) {
            if (mode === SEND_MODE_TAXI) {
                extraOptions = Options.newOptions()
                    .addExecutorNativeDropOption(
                        ethers.utils.parseUnits('0.01').toString(),
                        ethers.utils.hexlify(addressToBytes32(user.address))
                    )
                    .toBytes()
            } else if (mode === SEND_MODE_BUS) {
                const OPTIONS_TYPE = 1
                extraOptions = ethers.utils.arrayify(ethers.utils.solidityPack(['uint16', 'uint8'], [OPTIONS_TYPE, 1]))
            }
        }
        if (composeMsg) {
            if (mode === SEND_MODE_TAXI) {
                const builder =
                    extraOptions.length === 0
                        ? Options.newOptions()
                        : Options.fromOptions(ethers.utils.hexlify(extraOptions))
                extraOptions = builder.addExecutorComposeOption(0, 50000, 0).toBytes()
            } else if (mode === SEND_MODE_BUS) {
                const OPTIONS_TYPE = 1
                if (extraOptions.length === 0) {
                    extraOptions = ethers.utils.arrayify(
                        ethers.utils.solidityPack(['uint16', 'uint128', 'uint128'], [OPTIONS_TYPE, 50000, 0])
                    )
                    console.log(`extraOptions:${extraOptions.length}`)
                } else {
                    extraOptions = ethers.utils.arrayify(
                        ethers.utils.solidityPack(
                            ['uint16', 'uint128', 'uint128', 'uint8'],
                            [OPTIONS_TYPE, 50000, 0, 1]
                        )
                    )
                }
            }
        }
        const sendParams = {
            dstEid,
            to: ethers.utils.hexlify(addressToBytes32(user.address)),
            amountLD: amount,
            minAmountLD: minAmount,
            extraOptions: ethers.utils.hexlify(extraOptions),
            composeMsg: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(composeMsg ?? '')),
            oftCmd: oftCmd.toBytes(),
        }

        const [nativeFee, lzTokenFee] = await stargate.quoteSend(sendParams, false)
        console.log(`nativeFee:${nativeFee.toString()} lzTokenFee:${lzTokenFee.toString()}`)
        console.log(`sendParams:${JSON.stringify(sendParams)}`)
        const receipt = await (
            await stargate.connect(user).send(sendParams, { nativeFee, lzTokenFee }, user.address, {
                value: nativeFee.add(value).toString(),
                gasPrice,
            })
        ).wait()
        console.log(`Stargate.send() with mode ${mode} tx hash: ${receipt.transactionHash}`)
        console.log(`Gas used: ${receipt.gasUsed.toString()}`)
    } else {
        const messagingDeployment = await hre.deployments.get('TokenMessaging')
        const messaging = (await hre.ethers.getContractAt(
            messagingDeployment.abi,
            messagingDeployment.address
        )) as TokenMessaging
        const queue = await messaging.busQueues(dstEid)
        const nextTicketId = queue.nextTicketId
        const queueLength = queue.qLength
        console.log('nextTicketId:', nextTicketId.toString())
        console.log('queue length:', queueLength.toString())
        if (queueLength === 0) {
            console.error('No passengers found!')
            return
        }
        const allRideEvents = (await messaging.queryFilter(messaging.filters.BusRode())).filter(
            (e) => e.args.dstEid === dstEid && e.args.ticketId.gte(nextTicketId)
        )
        passengers = allRideEvents.map((e) => e.args.passenger)
        console.log('passengers:', passengers)
        let passengersInfo = passengers.map((p) => p.replace('0x', '')).join('')
        passengersInfo =
            ethers.utils.solidityPack(['uint8', 'uint56'], [passengers.length, nextTicketId]) + passengersInfo
        const [nativeFee] = await messaging.quoteDriveBus(dstEid, passengersInfo)
        const receipt = await (
            await messaging.connect(user).driveBus(dstEid, passengersInfo, { value: nativeFee.toString() })
        ).wait()
        console.log(`Messaging.driveBus() tx hash: ${receipt.transactionHash}`)
        console.log(`Gas used: ${receipt.gasUsed.toString()}`)
    }
}
task('send', 'send token/lp to another chain', action)
    .addParam('dstNetwork', 'destination network')
    .addOptionalParam('amount', 'amount to send')
    .addParam('sender', 'sender name')
    .addParam('mode', 'send mode', 'taxi')
    .addParam('token', 'token name', undefined, types.token)
    .addOptionalParam('composeMsg', 'compose message')
    .addFlag('nativeDrop', 'drop native token to destination chain')
