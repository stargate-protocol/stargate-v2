import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { task, types } from 'hardhat/config'
import { ActionType, HardhatRuntimeEnvironment } from 'hardhat/types'

import { makeBytes32 } from '@layerzerolabs/devtools'

import { SendParamStruct } from '../ts-src/typechain-types/@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT'
import { getNamedAccount } from '../ts-src/utils/util'

const DEFAULT_EXTRA_OPTIONS = '0x'
const DEFAULT_COMPOSE_MSG = '0x'
const DEFAULT_OFT_CMD = '0x'

const TOKEN_ABI = ['function token() public view returns (address)']

const getOFTAdapterToken = async (
    hre: HardhatRuntimeEnvironment,
    oftAdapterAddress: string,
    signer: SignerWithAddress
): Promise<string> => {
    return await (await hre.ethers.getContractAt(TOKEN_ABI, oftAdapterAddress, signer)).token()
}

/**
 * No fee for the caller by default.
 * @param {SignerWithAddress} user
 */
const getDefaultFeeObject = (user: SignerWithAddress) => {
    return {
        callerBps: 0,
        caller: user.address,
        partnerId: '0x0000',
    }
}

const createSendParam = (user: SignerWithAddress, taskArgs: TaskArgs): SendParamStruct => {
    return {
        dstEid: taskArgs.dstEid,
        to: makeBytes32(user.address),
        amountLD: taskArgs.amountLd,
        minAmountLD: taskArgs.minAmountLd,
        extraOptions: DEFAULT_EXTRA_OPTIONS,
        composeMsg: DEFAULT_COMPOSE_MSG,
        oftCmd: DEFAULT_OFT_CMD,
    }
}

interface TaskArgs {
    oftAddress: string
    dstEid: number
    amountLd: number
    minAmountLd: number
    isAdapter: boolean
}

const action: ActionType<TaskArgs> = async (taskArgs: TaskArgs, hre) => {
    const { ERC20__factory, OFTWrapper__factory } = await import('../ts-src/typechain-types')

    const signer = await hre.getNamedAccounts().then(getNamedAccount('deployer'))
    const user = await hre.ethers.getSigner(signer)

    const oftWrapperDeployment = await hre.deployments.get('OFTWrapper')
    const oftWrapper = OFTWrapper__factory.connect(oftWrapperDeployment.address, user)

    const sendParam: SendParamStruct = createSendParam(user, taskArgs)
    const feeObj = getDefaultFeeObject(user)
    const messagingFee = await oftWrapper.estimateSendFeeEpv2(taskArgs.oftAddress, sendParam, false, feeObj)
    console.log(`Estimated messaging fee: ${messagingFee}`)

    let nonce = await user.getTransactionCount()
    const token = ERC20__factory.connect(
        taskArgs.isAdapter ? await getOFTAdapterToken(hre, taskArgs.oftAddress, user) : taskArgs.oftAddress,
        user
    )
    const approveTx = await token.approve(oftWrapper.address, taskArgs.amountLd, {
        nonce: nonce++,
        gasLimit: 1_000_000,
    })
    const approveReceipt = await approveTx.wait()
    console.log(`Token.approve() tx hash: ${approveReceipt.transactionHash}`)

    const sendMethod = taskArgs.isAdapter ? 'sendOFTAdapterEpv2' : 'sendOFTEpv2'
    const sendTx = await oftWrapper
        .connect(user)
        [sendMethod](taskArgs.oftAddress, sendParam, messagingFee, user.address, feeObj, {
            value: messagingFee.nativeFee,
            nonce: nonce++,
            gasLimit: 1_000_000,
        })
    const sendReceipt = await sendTx.wait()
    console.log(`OFTWrapper.sendOFT${taskArgs.isAdapter && 'Adapter'}Epv2() tx hash: ${sendReceipt.transactionHash}`)
}

// Usage E.g.:
// OFT Example:
// npx hardhat --network arbitrum-mainnet oftTransfer \
//   --oft-address 0x58538e6a46e07434d7e7375bc268d3cb839c0133 \
//   --dst-eid 30101 \
//   --amount-ld 10000000000000 \
//   --min-amount-ld 100000000000
//
// OFTAdapter Example:
// npx hardhat --network ethereum-mainnet oftTransfer \
//   --oft-address 0x58538e6a46e07434d7e7375bc268d3cb839c0133 \
//   --dst-eid 30110 \
//   --amount-ld 10000000000000 \
//   --min-amount-ld 100000000000 \
//   --is-adapter true
//
task('oftTransfer', 'Transfer generic OFT from one chain to another', action)
    .addParam('oftAddress', 'OFT or OFTAdapter address')
    .addParam('dstEid', 'Destination EID')
    .addParam('amountLd', 'Amount to send in local decimals')
    .addParam('minAmountLd', 'Minimum amount to receive in local decimals')
    .addParam('isAdapter', 'Is adapter', false, types.boolean)
