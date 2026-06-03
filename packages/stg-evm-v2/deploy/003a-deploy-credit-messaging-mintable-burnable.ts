import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { getNetworkConfig } from '@stargatefinance/stg-definitions-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger } from '@layerzerolabs/io-devtools'

import { CONTRACT_CREDIT_MESSAGING_MINTABLE_BURNABLE_TAGS } from '../ts-src'
import { createDeploy, getFeeData } from '../ts-src/utils/deployments'

export default async function (hre: HardhatRuntimeEnvironment) {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()
    const network = hre.network.name
    const eid = getEidForNetworkName(network)
    const logger = createModuleLogger(`CreditMessagingMintableBurnable Deployer @ ${network}`)
    const { creditMessaging } = getNetworkConfig(eid)

    if (creditMessaging == null) {
        logger.info(`No creditMessaging config for ${network}, skipping`)
        return
    }

    const endpointDeployment = await hre.deployments.get('EndpointV2')
    logger.info(
        `Deploying CreditMessagingMintableBurnable on ${network} as: ${deployer} with endpoint: ${endpointDeployment.address}`
    )

    await deploy('CreditMessaging', {
        contract: 'CreditMessagingMintableBurnable',
        from: deployer,
        args: [endpointDeployment.address, deployer],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: false,
        ...feeData,
    })
}

// Skip during normal deployments — only runs when explicitly triggered with:
// DEPLOY_MINTABLE_BURNABLE=true npx hardhat deploy --tags credit-messaging-mintable-burnable
exports.default.skip = async () => process.env.DEPLOY_MINTABLE_BURNABLE !== 'true'
exports.default.tags = CONTRACT_CREDIT_MESSAGING_MINTABLE_BURNABLE_TAGS
