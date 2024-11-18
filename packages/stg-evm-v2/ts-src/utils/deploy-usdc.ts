import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import { getUSDCImplDeployName, getUSDCProxyDeployName, getUSDCSignatureLibDeployName } from '../../ops/util'
import { CONTRACT_USDC_TAGS } from '../constants'

import { createDeploy, getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetNetworkConfigMaybe, getTokenConfig } from './util'

const appendTokenTags = appendTags(CONTRACT_USDC_TAGS)

const tokenName = TokenName.USDC

export const createDeployUSDC = (): DeployFunction =>
    appendTokenTags(async (hre) => {
        // First let's get some basic info
        const network = hre.network.name
        const eid = getEidForNetworkName(network)
        const logger = createModuleLogger(`USDC Deployer @ ${network}`)

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

        return await deployUSDC(hre, { ...tokenProperties, logger })
    })

interface DeployUSDCOptions {
    name: string
    symbol: string
    logger: Logger
}

const deployUSDC = async (hre: HardhatRuntimeEnvironment, { logger, name, symbol }: DeployUSDCOptions) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer, usdcAdmin } = await hre.getNamedAccounts()
    const deployerSigner = await hre.ethers.getSigner(deployer)

    const signLibContractName = 'SignatureChecker'
    const implContractName = 'FiatTokenV2_2'
    const proxyContractName = 'FiatTokenProxy'
    const addressOne = '0x0000000000000000000000000000000000000001'

    const signLibDeploymentName = getUSDCSignatureLibDeployName()
    const implDeploymentName = getUSDCImplDeployName()
    const proxyDeploymentName = getUSDCProxyDeployName()

    logger.info(`Deploying USDC token ${symbol} (name ${name})`)

    logger.info(`Deploying USDC SignatureChecker library contract ${signLibContractName} as ${signLibDeploymentName}`)
    const signatureCheckerLibDeployment = await deploy(signLibDeploymentName, {
        contract: signLibContractName,
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        gasPrice: await hre.ethers.provider.getGasPrice(),
    })

    logger.info(`Deploying USDC implementation contract ${implContractName} as ${implDeploymentName}`)
    // Deploy implementation contract
    const implTokenDeployment = await deploy(implDeploymentName, {
        contract: implContractName,
        from: usdcAdmin,
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
        logger.info(`Bricking USDC implementation contract initialization on ${implDeploymentName}`)

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

    logger.info(`Deploying USDC proxy contract based on contract ${proxyContractName} as ${proxyDeploymentName}`)
    // Deploy upgradable proxy contract
    const proxyDeployment = await deploy(proxyDeploymentName, {
        contract: proxyContractName,
        from: usdcAdmin,
        args: [implTokenDeployment.address],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })

    // Initialize the proxy
    if (proxyDeployment.newlyDeployed) {
        logger.info(`Initializing USDC proxy contract based on contract ${proxyContractName} as ${proxyDeploymentName}`)

        const proxyContract = new hre.ethers.Contract(
            proxyDeployment.address,
            implTokenDeployment.abi, // impose the impl ABI on the proxy
            deployerSigner
        )

        logger.info(`Initializing USDC proxy contract with ${deployer} as the new owner`)
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
