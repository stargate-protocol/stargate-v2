import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { REWARDS } from '@stargatefinance/stg-definitions-v2'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { CONTRACT_STAKING_TAGS } from '../ts-src'
import { createDeploy, getFeeData } from '../ts-src/utils/deployments'

import type { DeployFunction } from 'hardhat-deploy/dist/types'

// Determine if a given network contains rewards
const hasRewards = (eid: EndpointId) => Object.values(REWARDS).some(({ networks }) => networks[eid] != null)

const deploy: DeployFunction = async (hre) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()

    const logger = createModuleLogger(`StargateStaking Deployer @ ${hre.network.name}`)
    logger.info(`Deploying ...`)

    const eid = getEidForNetworkName(hre.network.name)

    if (!hasRewards(eid)) {
        return logger.warn('Skipping deployment: no reward token config found'), undefined
    }

    await deploy('StargateStaking', {
        from: deployer,
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

deploy.tags = CONTRACT_STAKING_TAGS

export default deploy
