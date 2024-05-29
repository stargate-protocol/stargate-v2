import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { CONTRACT_FEE_LIB_TAGS } from '..'
import { getFeeLibV1DeployName, getStargateDeployName } from '../../ops/util'

import { createDeploy, getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetTypeMaybe } from './util'

const appendFeelibV1Tags = appendTags(CONTRACT_FEE_LIB_TAGS)

interface CreateDeployFeelibV1Options {
    tokenName: TokenName
}

export const createDeployFeelibV1 = ({ tokenName }: CreateDeployFeelibV1Options): DeployFunction =>
    appendFeelibV1Tags(async (hre) => {
        const deploy = createDeploy(hre)
        const feeData = await getFeeData(hre)
        const { deployer } = await hre.getNamedAccounts()

        const network = hre.network.name
        const eid = getEidForNetworkName(network)
        const logger = createModuleLogger(`FeeLibV1: ${tokenName} Deployer @ ${network}`)
        const stargateType = getAssetTypeMaybe(eid, tokenName)
        if (stargateType == null) {
            return logger.warn(`Skipping deployment: no asset type`), undefined
        }

        const stargateDeployName = getStargateDeployName(tokenName, stargateType)
        const { address: assetAddress } = await hre.deployments.get(stargateDeployName)

        const feeLibDeployName = getFeeLibV1DeployName(tokenName)

        logger.info(`Deploying for ${stargateDeployName} with asset ${assetAddress}`)
        await deploy(feeLibDeployName, {
            contract: 'FeeLibV1',
            from: deployer,
            args: [assetAddress],
            log: true,
            waitConfirmations: 1,
            skipIfAlreadyDeployed: true,
            ...feeData,
        })
    })
