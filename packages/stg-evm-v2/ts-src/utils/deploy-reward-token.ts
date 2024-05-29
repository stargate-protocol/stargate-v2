import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { REWARDS, RewardTokenName } from '@stargatefinance/stg-definitions-v2'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger, printRecord } from '@layerzerolabs/io-devtools'

import { CONTRACT_REWARDER_TAGS } from '../constants'

import { createDeploy, getFeeData } from './deployments'
import { appendTags } from './helpers'

const appendRewardTokenTags = appendTags(CONTRACT_REWARDER_TAGS)

interface CreateDeployRewardTokenOptions {
    tokenName: RewardTokenName
}

export const createDeployRewardToken = ({ tokenName }: CreateDeployRewardTokenOptions): DeployFunction =>
    appendRewardTokenTags(async (hre) => {
        const deploy = createDeploy(hre)
        const feeData = await getFeeData(hre)
        const { deployer } = await hre.getNamedAccounts()

        const network = hre.network.name
        const eid = getEidForNetworkName(network)
        const logger = createModuleLogger(`Reward Token for ${tokenName} Deployer @ ${network}`)

        const tokenConfig = REWARDS[tokenName]
        const tokenNetworkConfig = tokenConfig.networks[eid]

        // We skip the deployment if the token has not been configured for this network
        if (tokenNetworkConfig == null) {
            return logger.warn(`Skipping deployment for token: not configured`), undefined
        }

        // We also skip the deployment if an external token address has been configured for this token
        if (tokenNetworkConfig.address != null) {
            return logger.warn(`Skipping deployment: using external address ${tokenNetworkConfig.address}`), undefined
        }

        logger.info(
            `\n${printRecord({
                'Reward Token': tokenConfig.name,
                Deployer: deployer,
                Network: network,
            })}`
        )

        await deploy(tokenConfig.name, {
            contract: 'ERC20Token',
            from: deployer,
            args: [tokenConfig.name, tokenConfig.name, 18], // TODO maybe we want to make this configurable?
            log: true,
            waitConfirmations: 1,
            skipIfAlreadyDeployed: true,
            ...feeData,
        })
    })
