import { task } from 'hardhat/config'
import { ActionType } from 'hardhat/types'

import { getNamedAccount } from '../ts-src/utils/util'

const action: ActionType<unknown> = async (_, hre) => {
    // The tasks need to import the TypeChain types dynamically
    // otherwise we end up in a chicken-egg scenario where compile will error out
    // since the TypeChain is not there but TypeChain needs compile
    const { OFTTokenERC20__factory, StargateMultiRewarder__factory } = await import('../ts-src/typechain-types')

    const signer = await hre.getNamedAccounts().then(getNamedAccount('deployer'))
    const deployer = await hre.ethers.getSigner(signer)
    const stargateMultiRewarderDeployment = await hre.deployments.get('StargateMultiRewarder')
    const stargateMultiRewarder = StargateMultiRewarder__factory.connect(
        stargateMultiRewarderDeployment.address,
        deployer
    )
    const rewardTokenDeployment = await hre.deployments.get('RewardTokenMock')
    const rewardToken = OFTTokenERC20__factory.connect(rewardTokenDeployment.address, deployer)

    // get current unix time stamp
    const start = Math.floor(Date.now() / 1000) + 100 // add 100 so start is in the future
    const duration = 2419200 // 28 days
    const amount = hre.ethers.utils.parseEther('2419200')

    const mintReceipt = await (await rewardToken.connect(deployer).mint(deployer.address, amount)).wait()
    console.log(`mint tx hash: ${mintReceipt.transactionHash}`)

    const approveReceipt = await (
        await rewardToken.connect(deployer).approve(stargateMultiRewarderDeployment.address, amount)
    ).wait()
    console.log(`approve tx hash: ${approveReceipt.transactionHash}`)

    const receipt = await (
        await stargateMultiRewarder.connect(deployer).setReward(rewardToken.address, amount, start, duration)
    ).wait()
    console.log(`Stargate.setReward() tx hash: ${receipt.transactionHash}`)
}

task('setRewards', 'set reward for StargateMultiRewarder', action)

// npx hardhat --network ethereum-sandbox-local setReward --reward-token 0xEe06926a58914FFFb4fcC06989d779b7A8102b89 --amount 10000 --start 1713308964 --duration 1000
