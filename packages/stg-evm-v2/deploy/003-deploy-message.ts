import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import assert from 'assert'

import { getNetworkConfig } from '@stargatefinance/stg-definitions-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { CONTRACT_MESSAGING_TAGS } from '../ts-src'
import { createDeploy, getFeeData } from '../ts-src/utils/deployments'

const isDivisorOf = (value: number, divisor: number) => value % divisor === 0
const isDivisorOf2ToThe16 = (divisor: number) => isDivisorOf(2 ** 16, divisor)

export default async function (hre: HardhatRuntimeEnvironment) {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()
    const network = hre.network.name
    const eid = getEidForNetworkName(network)
    const logger = createModuleLogger(`Messaging Deployer @ ${network}`)
    const { creditMessaging, tokenMessaging } = getNetworkConfig(eid)

    const endpointDeployment = await hre.deployments.get('EndpointV2')
    if (tokenMessaging != null) {
        const queueCapacity = tokenMessaging.queueCapacity
        assert(
            isDivisorOf2ToThe16(queueCapacity),
            `Queue capacity must be a divisor of 2**16 (65536), got: ${queueCapacity}`
        )

        logger.info(`Deploying TokenMessaging as: ${deployer}`)
        logger.info(`Deploying TokenMessaging with endpoint: ${endpointDeployment.address}`)
        logger.info(`Deploying TokenMessaging with queue capacity: ${queueCapacity}`)

        await deploy('TokenMessaging', {
            contract: 'TokenMessaging',
            from: deployer,
            args: [endpointDeployment.address, deployer, queueCapacity],
            log: true,
            waitConfirmations: 1,
            skipIfAlreadyDeployed: true,
            ...feeData,
        })
    }

    if (creditMessaging != null) {
        logger.info(`Deploying CreditMessaging as: ${deployer}`)
        await deploy('CreditMessaging', {
            contract: 'CreditMessaging',
            from: deployer,
            args: [endpointDeployment.address, deployer],
            log: true,
            waitConfirmations: 1,
            skipIfAlreadyDeployed: true,
            ...feeData,
        })
    }
}

exports.default.tags = CONTRACT_MESSAGING_TAGS
