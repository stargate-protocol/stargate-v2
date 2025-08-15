import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import {
    getCircleFiatTokenImplDeployName,
    getCircleFiatTokenProxyDeployName,
    getCircleFiatTokenSignatureLibDeployName,
} from '../../ops/util'
import { CONTRACT_EURC_TAGS, CONTRACT_USDC_TAGS } from '../constants'

import { createDeploy, getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetNetworkConfigMaybe, getTokenConfig } from './util'

export const createDeployCircleFiatToken = (tokenName: TokenName): DeployFunction =>
    appendTags(tokenName === TokenName.USDC ? CONTRACT_USDC_TAGS : CONTRACT_EURC_TAGS)(async (hre) => {
        // First let's get some basic info
        const network = hre.network.name
        const eid = getEidForNetworkName(network)
        const logger = createModuleLogger(`${tokenName} Deployer @ ${network}`)

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

        return await deployCircleFiatToken(hre, { tokenName, ...tokenProperties, logger })
    })

interface DeployCircleFiatTokenOptions {
    tokenName: TokenName
    name: string
    symbol: string
    logger: Logger
}

const deployCircleFiatToken = async (
    hre: HardhatRuntimeEnvironment,
    { logger, name, symbol, tokenName }: DeployCircleFiatTokenOptions
) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer, tokenAdmin } = await hre.getNamedAccounts()
    const deployerSigner = await hre.ethers.getSigner(deployer)

    const signLibContractName = 'SignatureChecker'
    const implContractName = 'FiatTokenV2_2'
    const proxyContractName = 'FiatTokenProxy'
    const addressOne = '0x0000000000000000000000000000000000000001'

    const signLibDeploymentName = getCircleFiatTokenSignatureLibDeployName(tokenName)
    const implDeploymentName = getCircleFiatTokenImplDeployName(tokenName)
    const proxyDeploymentName = getCircleFiatTokenProxyDeployName(tokenName)

    logger.info(`Deploying ${tokenName} token ${symbol} (name ${name})`)

    logger.info(
        `Deploying ${tokenName} SignatureChecker library contract ${signLibContractName} as ${signLibDeploymentName}`
    )
    const signatureCheckerLibDeployment = await deploy(signLibDeploymentName, {
        contract: signLibContractName,
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        gasPrice: await hre.ethers.provider.getGasPrice(),
    })

    logger.info(`Deploying ${tokenName} implementation contract ${implContractName} as ${implDeploymentName}`)
    // Deploy implementation contract
    const implTokenDeployment = await deploy(implDeploymentName, {
        contract: implContractName,
        from: tokenAdmin,
        args: [],
        libraries: {
            SignatureChecker: signatureCheckerLibDeployment.address,
        },
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })

    // Brick its initialization
    if (implTokenDeployment.newlyDeployed) {
        logger.info(`Bricking ${tokenName} implementation contract initialization on ${implDeploymentName}`)

        const implTokenContract = new hre.ethers.Contract(
            implTokenDeployment.address,
            implTokenDeployment.abi,
            deployerSigner
        )

        const brick0Tx = await implTokenContract.initialize(
            '',
            '',
            '',
            0,
            addressOne,
            addressOne,
            addressOne,
            addressOne
        )
        await brick0Tx.wait()

        const brick1Tx = await implTokenContract.initializeV2('')
        await brick1Tx.wait()

        const brick2Tx = await implTokenContract.initializeV2_1(addressOne)
        await brick2Tx.wait()

        const brick3Tx = await implTokenContract.initializeV2_2([], '')
        await brick3Tx.wait()
    }

    logger.info(
        `Deploying ${tokenName} proxy contract based on contract ${proxyContractName} as ${proxyDeploymentName}`
    )
    // Deploy upgradable proxy contract
    const proxyDeployment = await deploy(proxyDeploymentName, {
        contract: proxyContractName,
        from: tokenAdmin,
        args: [implTokenDeployment.address],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })

    // Initialize the proxy
    if (proxyDeployment.newlyDeployed) {
        logger.info(
            `Initializing ${tokenName} proxy contract based on contract ${proxyContractName} as ${proxyDeploymentName}`
        )

        const proxyContract = new hre.ethers.Contract(
            proxyDeployment.address,
            implTokenDeployment.abi, // impose the impl ABI on the proxy
            deployerSigner
        )

        logger.info(`Initializing ${tokenName} proxy contract with ${deployer} as the new owner`)
        // string tokenName, string tokenSymbol, string tokenCurrency, uint8 tokenDecimals, address newMasterMinter, address newPauser, address newBlacklister, address newOwner
        const init0Tx = await proxyContract.initialize(
            name,
            symbol,
            symbol,
            6,
            deployer, // set temporarily to us so we can setup the minter, then it will be set to stg multisig when we configure before we transfer ownership
            addressOne,
            addressOne,
            deployer
        )
        await init0Tx.wait()

        // string newName
        const init1Tx = await proxyContract.initializeV2(name)
        await init1Tx.wait()

        // address lostAndFound
        const init2Tx = await proxyContract.initializeV2_1(addressOne)
        await init2Tx.wait()

        // address[] accountsToBlacklist, string newSymbol
        const init3Tx = await proxyContract.initializeV2_2([], symbol)
        await init3Tx.wait()
    }
}
