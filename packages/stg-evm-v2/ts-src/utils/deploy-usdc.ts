import fs from 'fs' // Import the fs module
import path from 'path'

import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ContractFactory } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import { getUSDCImplDeployName, getUSDCProxyDeployName } from '../../ops/util'
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
    // TODO see arb source of truth for these values

    // Get the path to the file relative to the current script's directory
    const proxyBytecodePath = path.join(__dirname, 'USDCProxyBytecode.txt')
    const implBytecodePath = path.join(__dirname, 'USDCImplBytecode.txt')
    const proxyAbiPath = path.join(__dirname, 'USDCProxyAbi.json')
    const implAbiPath = path.join(__dirname, 'USDCImplAbi.json')

    // Now read the files
    const proxyBytecode = fs.readFileSync(proxyBytecodePath, 'utf8')
    const implBytecode = fs.readFileSync(implBytecodePath, 'utf8')
    const proxyAbi = JSON.parse(fs.readFileSync(proxyAbiPath, 'utf8'))
    const implAbi = JSON.parse(fs.readFileSync(implAbiPath, 'utf8'))

    const addressOne = '0x0000000000000000000000000000000000000001'

    // TODO maybe store bytecode and abis in separate files
    const implDeploymentName = getUSDCImplDeployName()
    const proxyDeploymentName = getUSDCProxyDeployName()

    logger.info(`Deploying USDC token ${symbol} (name ${name})`)

    // Deploy implementation contract with bytecode
    logger.info(`Deploying USDC implementation contract as ${implDeploymentName}`) // TODO use this name for the deployment...
    /**
     *         const deployment: Deployment = {
            address: contract.address,
            abi: artifact.abi,
            args: options.args,
            bytecode: artifact.bytecode,
            deployedBytecode: artifact.deployedBytecode,
            // FIXME This is here just so that the contract verification using @layerzerolabs/verify-contract
            // can parse this fake deployment file. This needs to be filled in with correct information
            // if we are to use the verification CLI
            metadata: JSON.stringify({
                language: 'solidity',
                compiler: {
                    version: '',
                },
                settings: {
                    compilationTarget: {},
                    evmVersion: '',
                    optimizer: {},
                },
                sources: {},
            }),
        }

        await hre.deployments.save(deploymentName, deployment)
     */

    const implOverrides = {
        ...feeData,
        // from: usdcAdmin,
        // log: true,
        // waitConfirmations: 1,
    }

    // const implContractFactory = new ContractFactory(implAbi, implBytecode, usdcAdminSigner) // TODO change this to me for now due to insufficient funds
    const implContractFactory = new ContractFactory(implAbi, implBytecode, deployerSigner) // TODO change this to me for now due to insufficient funds

    // const implTokenDeployment = await implContractFactory.connect(usdcAdminSigner).deploy(implOverrides) // TODO commented out for now bc insufficient funds
    const implTokenDeployment = await implContractFactory.deploy(implOverrides)

    await implTokenDeployment.deployed()

    // await implTokenDeployment.deployTransaction.wait(20)

    console.log('RAVINA impl contract is deployed: ', implTokenDeployment.address)

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

    // const proxyContractFactory = new ContractFactory(proxyAbi, proxyBytecode, usdcAdminSigner) // TODO changed to me for now bc insufficient funds
    const proxyContractFactory = new ContractFactory(proxyAbi, proxyBytecode, deployerSigner) // TODO changed to me for now bc insufficient funds
    // const proxyDeployment = await proxyContractFactory.connect(usdcAdminSigner).deploy(implTokenDeployment.address, {
    //     ...proxyOverrides,
    //     gasLimit: 5000000,
    // }) // TODO commented out for now bc insufficient funds
    const proxyDeployment = await proxyContractFactory.deploy(implTokenDeployment.address, {
        // TODO current issue: https://baobab.klaytnscope.com/tx/0xc8fab9e1421b00e5360888e0190b86577c2052163eb38af54f5f8a2bfe0b85ef?tabId=inputData
        ...proxyOverrides,
        gasLimit: 50000000,
    })

    await proxyDeployment.deployed()

    console.log('RAVINA proxy contract is deployed: ', proxyDeployment.address)

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
