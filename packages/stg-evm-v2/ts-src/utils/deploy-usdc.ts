import fs from 'fs' // Import the fs module
import path from 'path'

import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ContractFactory } from 'ethers'
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

    const usdcAdminSigner = await hre.ethers.getSigner(usdcAdmin)

    // Get the path to the file relative to the current script's directory
    const proxyBytecodePath = path.join(__dirname, 'USDCProxyBytecode.txt')
    const implBytecodePath = path.join(__dirname, 'USDCImplBytecode.txt')
    const sigBytecodePath = path.join(__dirname, 'USDCSignatureLibBytecode.txt')

    const proxyAbiPath = path.join(__dirname, 'USDCProxyAbi.json')
    const implAbiPath = path.join(__dirname, 'USDCImplAbi.json')
    const sigAbiPath = path.join(__dirname, 'USDCSignatureLibAbi.json')

    // Now read the files
    const proxyBytecode = fs.readFileSync(proxyBytecodePath, 'utf8')
    const implBytecode = fs.readFileSync(implBytecodePath, 'utf8')
    const sigBytecode = fs.readFileSync(sigBytecodePath, 'utf8')

    const proxyAbi = JSON.parse(fs.readFileSync(proxyAbiPath, 'utf8'))
    const implAbi = JSON.parse(fs.readFileSync(implAbiPath, 'utf8'))
    const sigAbi = JSON.parse(fs.readFileSync(sigAbiPath, 'utf8'))

    const addressOne = '0x0000000000000000000000000000000000000001'

    const signLibDeploymentName = getUSDCSignatureLibDeployName()
    const implDeploymentName = getUSDCImplDeployName()
    const proxyDeploymentName = getUSDCProxyDeployName()

    logger.info(`Deploying USDC token ${symbol} (name ${name})`)

    logger.info(`Deploying USDC SignatureChecker library contract as ${signLibDeploymentName}`)

    const sigOverrides = {
        gasPrice: await hre.ethers.provider.getGasPrice(),
        // from: usdcAdmin,
        // log: true,
        // waitConfirmations: 1,
    }

    const signatureCheckerContractFactory = new ContractFactory(sigAbi, sigBytecode, deployerSigner)
    // const signatureCheckerLibDeployment = await signatureCheckerContractFactory.connect(usdcAdminSigner).deploy(sigOverrides) // TODO commented out for now bc insufficient funds
    const signatureCheckerLibDeployment = await signatureCheckerContractFactory.deploy(sigOverrides)

    logger.info(`${signLibDeploymentName} is deployed: ${signatureCheckerLibDeployment.address}`)

    // Deploy implementation contract with bytecode
    logger.info(`Deploying USDC implementation contract as ${implDeploymentName}`) // TODO use this name for the deployment...

    const implOverrides = {
        ...feeData,
        // libraries: {
        //     SignatureChecker: signatureCheckerLibDeployment.address,
        // }, // TODO commented out for now bc libraries key is not recognized in overrides
        // from: usdcAdmin, // TODO can use .connect
        // log: true,
        // waitConfirmations: 1,
    }

    const implContractFactory = new ContractFactory(implAbi, implBytecode, deployerSigner)

    // const implTokenDeployment = await implContractFactory.connect(usdcAdminSigner).deploy(implOverrides) // TODO commented out for now bc insufficient funds
    const implTokenDeployment = await implContractFactory.deploy(implOverrides)

    await implTokenDeployment.deployed()

    logger.info(`${implDeploymentName} is deployed: ${implTokenDeployment.address}`)

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

    // Deploy upgradable proxy contract with bytecode
    logger.info(`Deploying USDC proxy contract as ${proxyDeploymentName}`)

    const proxyOverrides = {
        ...feeData,
        // from: usdcAdmin,
        // log: true,
        // waitConfirmations: 1,
    }

    const proxyContractFactory = new ContractFactory(proxyAbi, proxyBytecode, deployerSigner)
    // const proxyDeployment = await proxyContractFactory.connect(usdcAdminSigner).deploy(implTokenDeployment.address, {
    //     ...proxyOverrides,
    //     gasLimit: 5000000,
    // }) // TODO commented out for now bc insufficient funds
    const proxyDeployment = await proxyContractFactory.deploy(implTokenDeployment.address, {
        ...proxyOverrides,
        gasLimit: 500000,
    })

    await proxyDeployment.deployed()

    logger.info(`${proxyDeploymentName} is deployed: ${proxyDeployment.address}`)

    // Initialize the proxy
    if (proxyDeployment.newlyDeployed) {
        logger.info(`Initializing USDC proxy contract based on ${proxyDeploymentName}`)

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
