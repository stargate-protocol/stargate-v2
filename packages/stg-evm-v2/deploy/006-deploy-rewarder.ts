import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { CONTRACT_REWARDER_TAGS, CONTRACT_STAKING_TAGS } from '../ts-src'
import { createDeploy, getFeeData } from '../ts-src/utils/deployments'

import type { DeployFunction } from 'hardhat-deploy/dist/types'

const deploy: DeployFunction = async (hre) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()

    const stakingDeployment = await hre.deployments.getOrNull('StargateStaking')

    const logger = createModuleLogger(`Rewarder Deployer @ ${hre.network.name}`)
    logger.info(`Deploying ...`)

    if (stakingDeployment == null) {
        return logger.warn('Skipping deployment: no StargateStaking found'), undefined
    }

    const { address: rewardLibAddress } = await deploy('RewardLib', {
        from: deployer,
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })

    const { address: rewardRegistryLibAddress } = await deploy('RewardRegistryLib', {
        from: deployer,
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })

    await deploy('StargateMultiRewarder', {
        from: deployer,
        args: [stakingDeployment.address],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        libraries: {
            RewardLib: rewardLibAddress,
            RewardRegistryLib: rewardRegistryLibAddress,
        },
        ...feeData,
    })
}

deploy.dependencies = [...CONTRACT_STAKING_TAGS]
deploy.tags = CONTRACT_REWARDER_TAGS

export default deploy
