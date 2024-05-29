import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { CONTRACT_TREASURER_TAGS } from '../ts-src'
import { createDeploy, getFeeData } from '../ts-src/utils/deployments'

import type { DeployFunction } from 'hardhat-deploy/dist/types'

const deploy: DeployFunction = async (hre) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()

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
