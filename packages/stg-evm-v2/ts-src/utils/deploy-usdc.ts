import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { HardhatRuntimeEnvironment, Libraries } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import { getUSDCImplDeployName, getUSDCProxyDeployName, getUSDCSignatureLibDeployName } from '../../ops/util'
import { CONTRACT_USDC_TAGS } from '../constants'

import USDCImpl from './USDCImpl.json'
import USDCProxy from './USDCProxy.json'
import USDCSignatureLib from './USDCSignatureLib.json'
import { getFeeData } from './deployments'
import { appendTags, deploy, fillAddress } from './helpers'
import { getAssetNetworkConfigMaybe, getTokenConfig } from './util'

const appendTokenTags = appendTags(CONTRACT_USDC_TAGS)

const tokenName = TokenName.USDC

// Deploy function for USDC
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
    const feeData = await getFeeData(hre)
    const { deployer, usdcAdmin } = await hre.getNamedAccounts()
    const deployerSigner = await hre.ethers.getSigner(deployer)
    const usdcAdminSigner = await hre.ethers.getSigner(usdcAdmin)

    const addressOne = '0x0000000000000000000000000000000000000001'

    logger.info(`Deploying USDC token ${symbol} (name ${name})`)

    // Deploy the SignatureChecker library contract with bytecode

    const sigOverrides = {
        gasPrice: await hre.ethers.provider.getGasPrice(),
    }

    const signatureCheckerLib = await deploy({
        hre,
        deploymentName: getUSDCSignatureLibDeployName(),
        overrides: sigOverrides,
        abi: USDCSignatureLib.abi,
        creationBytecode: USDCSignatureLib.bytecode,
        signer: deployerSigner /** todo should be usdcAdminSigner */,
        logger,
        libraries: {},
        args: [],
    })

    // Deploy implementation contract with bytecode

    // Link the SignatureChecker library into the implementation bytecode
    const implBytecodeWithLib = fillAddress(USDCImpl.bytecode, signatureCheckerLib.address)
    const implOverrides = {
        ...feeData,
    }
    const implDeploymentName = getUSDCImplDeployName()

    const libraries: Libraries = {
        SignatureChecker: signatureCheckerLib.address,
    }

    const implToken = await deploy({
        hre,
        deploymentName: implDeploymentName,
        overrides: implOverrides,
        abi: USDCImpl.abi,
        creationBytecode: implBytecodeWithLib,
        signer: deployerSigner /** todo should be usdcAdminSigner */,
        logger,
        libraries,
        args: [],
    })

    // TODO In main this is false if deployment files exist and errors out with gas estimation error if files don't exist
    // In ravina/usdc-updates this is always undefined....why?
    // console.log('is implToken newly deployed? ', implToken.newlyDeployed)

    // Brick its initialization
    if (implToken.newlyDeployed) {
        logger.info(`Bricking USDC implementation contract initialization on ${implDeploymentName}`)

        const implTokenContract = new hre.ethers.Contract(implToken.address, implToken.abi, deployerSigner)

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

    // Deploy upgradable proxy contract with bytecode

    const proxyDeploymentName = getUSDCProxyDeployName()
    const proxyOverrides = {
        ...feeData,
    }

    const proxyBytecodeWithImplAddress = fillAddress(USDCProxy.bytecode, implToken.address)

    const proxy = await deploy({
        hre,
        deploymentName: proxyDeploymentName,
        overrides: proxyOverrides,
        abi: USDCProxy.abi,
        creationBytecode: proxyBytecodeWithImplAddress,
        signer: deployerSigner /** todo should be usdcAdminSigner */,
        logger,
        libraries: {},
        args: [implToken.address],
    })

    // console.log('is proxy newly deployed? ', proxy.newlyDeployed)
    // Initialize the proxy
    if (proxy.newlyDeployed) {
        logger.info(`Initializing USDC proxy contract based on ${proxyDeploymentName}`)

        const proxyContract = new hre.ethers.Contract(
            proxy.address,
            implToken.abi, // impose the impl ABI on the proxy
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

        console.log('proxy initialized')
    }
}
