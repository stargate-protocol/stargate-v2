import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { CONTRACT_TREASURER_TAGS } from '../ts-src'
import { createDeploy, getFeeData } from '../ts-src/utils/deployments'

import type { DeployFunction } from 'hardhat-deploy/dist/types'

const deploy: DeployFunction = async (hre) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()

    const logger = createModuleLogger(`Treasurer Deployer @ ${hre.network.name}`)

    const tokenMessaging = await hre.deployments.getOrNull('TokenMessaging')
    if (tokenMessaging == null) {
        return logger.warn('Skipping deployment: no TokenMessaging found'), undefined
    }

    await deploy('Treasurer', {
        from: deployer,
        log: true,
        args: [deployer, deployer],
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

deploy.tags = CONTRACT_TREASURER_TAGS

export default deploy
