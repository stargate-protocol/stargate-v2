import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import { getUSDTDeployName } from '../../ops/util'
import { CONTRACT_USDT_TAGS } from '../constants'

import { createDeploy, getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetNetworkConfigMaybe, getTokenConfig } from './util'

const appendTokenTags = appendTags(CONTRACT_USDT_TAGS)

const tokenName = TokenName.USDT

export const createDeployUSDT = (): DeployFunction =>
    appendTokenTags(async (hre) => {
        // First let's get some basic info
        const network = hre.network.name
        const eid = getEidForNetworkName(network)
        const logger = createModuleLogger(`USDT Deployer @ ${network}`)

        const tokenConfig = getAssetNetworkConfigMaybe(eid, tokenName)
        if (tokenConfig == null) {
            return logger.warn(`Skipping deployment for Token for ${tokenName}: no config`), undefined
        }

        const stargateType = tokenConfig.type

        // We don't want to be deploying native currency, might be overambitious
        if (stargateType === StargateType.Native) {
            return logger.warn(`Skipping token deployment for native token ${tokenName}`), undefined
        }

        const tokenProperties = getTokenConfig(eid, tokenName)

        // We also don't want to be deploying external tokens
        if (tokenProperties.address != null) {
            return logger.warn(`Skipping token deployment for external token ${tokenName}`), undefined
        }

        if (stargateType === StargateType.Oft) {
            return await deployUSDTOFT(hre, {
                ...tokenProperties,
                logger,
            })
        }

        if (stargateType === StargateType.Pool) {
            return await deployUSDTPool(hre, {
                ...tokenProperties,
                logger,
            })
        }

        // We don't want to be deploying native currency, might be overambitious
        if (stargateType === StargateType.Native) {
            return logger.warn(`Skipping token deployment for native token ${TokenName.USDT}`), undefined
        }
    })

interface DeployUSDTOptions {
    logger: Logger
    name: string
    symbol: string
    localDecimals: number
}

const deployUSDTPool = async (
    hre: HardhatRuntimeEnvironment,
    { logger, name, symbol, localDecimals }: DeployUSDTOptions
) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()

    const contractName = 'ERC20Token'
    const deploymentName = getUSDTDeployName()

    logger.info(`Deploying USDT Pool token ${symbol} (decimals ${localDecimals})`)
    logger.info(`Deploying USDT Pool token based on contract ${contractName} as ${deploymentName}`)

    await deploy(deploymentName, {
        contract: contractName,
        from: deployer,
        args: [name, symbol, localDecimals], // TODO should reference token config
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

const deployUSDTOFT = async (
    hre: HardhatRuntimeEnvironment,
    { logger, name, symbol, localDecimals }: DeployUSDTOptions
) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()
    const signer = await hre.ethers.getSigner(deployer)

    const implContractName = 'OFTTokenERC20Upgradeable'
    const implDeploymentName = getUSDTDeployName()

    logger.info(`Deploying USDT OFT token ${symbol} (name ${name})`)
    logger.info(`Deploying USDT OFT token based on contract ${implContractName} as ${implDeploymentName}`)

    // Deploy implementation contract
    const implTokenDeployment = await deploy(implDeploymentName, {
        contract: implContractName,
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })

    // Initialize it
    if (implTokenDeployment.newlyDeployed) {
        logger.info(
            `Initializing USDT contract on ${implDeploymentName} with name ${name} and symbol ${symbol} and decimals ${localDecimals})`
        )

        const implTokenContract = new hre.ethers.Contract(implTokenDeployment.address, implTokenDeployment.abi, signer)

        const initTx = await implTokenContract.initialize(name, symbol, localDecimals)
        await initTx.wait()
    }
}
