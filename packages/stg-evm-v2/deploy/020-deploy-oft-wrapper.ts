import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { OFT_WRAPPER } from '@stargatefinance/stg-definitions-v2'

import { formatEid } from '@layerzerolabs/devtools'
import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { CONTRACT_OFT_WRAPPER_TAGS } from '../ts-src'
import { createDeploy, getFeeData } from '../ts-src/utils/deployments'

import type { DeployFunction } from 'hardhat-deploy/dist/types'

const deploy: DeployFunction = async (hre) => {
    const eid = getEidForNetworkName(hre.network.name, hre)
    const logger = createModuleLogger(`OFTWrapper @ ${formatEid(eid)}`)

    const networkConfig = OFT_WRAPPER.networks[eid]
    if (networkConfig == null) {
        return logger.warn(`No config, skipping`), undefined
    }

    const bps = networkConfig.bps ?? OFT_WRAPPER.bps
    const callerBpsCap = networkConfig.callerBpsCap ?? OFT_WRAPPER.callerBpsCap
    logger.info(`Setting BPS to ${bps} and callerBpsCap to ${callerBpsCap}`)

    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()

    await deploy('OFTWrapper', {
        from: deployer,
        log: true,
        args: [bps.toString(), callerBpsCap.toString()],
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

deploy.tags = CONTRACT_OFT_WRAPPER_TAGS

export default deploy
