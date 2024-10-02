import fs from 'fs'
import path from 'path'

import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { Contract, ContractFactory } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction, Deployment } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import { getUSDCImplDeployName, getUSDCProxyDeployName, getUSDCSignatureLibDeployName } from '../../ops/util'
import { CONTRACT_USDC_TAGS } from '../constants'

import { getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetNetworkConfigMaybe, getTokenConfig } from './util'

const appendTokenTags = appendTags(CONTRACT_USDC_TAGS)

const tokenName = TokenName.USDC
// TODO let jan know that circle mentioned all 3 contracts must be re-deployed

// TODO then write tests so that you can deploy to local hardhat node, call a function from the contract to ensure it works

// Utility to replace any $ in bytecode with the library address
export function fillAddress(bytecode: string, libraryAddress: string) {
    // TODO write tests for this function
    // Ensure the address is 40 characters long (without the 0x prefix)
    if (libraryAddress.slice(0, 2) === '0x') {
        libraryAddress = libraryAddress.slice(2)
    }
    if (libraryAddress.length !== 40) {
        throw new Error(`Invalid library address length ${libraryAddress}`)
    }

    // Find the placeholder in the bytecode
    const placeholder = `$`
    while (bytecode.includes(placeholder)) {
        bytecode = bytecode.replace(placeholder, libraryAddress)
    }

    return bytecode
}

// Saves deployment information to the deployments folder
// TODO write tests for this function
async function saveDeployment(
    hre: HardhatRuntimeEnvironment,
    deploymentName: string,
    deploymentContract: Contract,
    abi: any,
    creationBytecode: string,
    deployedBytecode: string
) {
    const sigDeployment: Deployment = {
        address: deploymentContract.address,
        abi: abi as any,
        transactionHash: deploymentContract.deployTransaction.hash,
        receipt: await deploymentContract.deployTransaction.wait(),
        args: [],
        bytecode: creationBytecode,
        deployedBytecode: deployedBytecode,
        metadata: JSON.stringify({
            language: 'solidity',
            compiler: {
                version: '0.6.12+commit.27d51765',
            },
            settings: {
                compilationTarget: {},
                evmVersion: 'istanbul',
                optimizer: {
                    enabled: true,
                    runs: 10000000,
                },
            },
            sources: {},
        }),
    }

    await hre.deployments.save(deploymentName, sigDeployment)
}

// Deploy function for USDC
// TODO write tests for this function? it is unchanged from the original...
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

// TODO write tests for this function, specifically call an impl function on the proxy to ensure it works
const deployUSDC = async (hre: HardhatRuntimeEnvironment, { logger, name, symbol }: DeployUSDCOptions) => {
    const feeData = await getFeeData(hre)
    const { deployer, usdcAdmin } = await hre.getNamedAccounts()
    const deployerSigner = await hre.ethers.getSigner(deployer)
    const usdcAdminSigner = await hre.ethers.getSigner(usdcAdmin)

    // Get the path to the file relative to the current script's directory
    const proxyCreationBytecodePath = path.join(__dirname, 'USDCProxyBytecode.txt')
    const implCreationBytecodePath = path.join(__dirname, 'USDCImplBytecode.txt')
    const sigCreationBytecodePath = path.join(__dirname, 'USDCSignatureLibBytecode.txt')

    const proxyAbiPath = path.join(__dirname, 'USDCProxyAbi.json')
    const implAbiPath = path.join(__dirname, 'USDCImplAbi.json')
    const sigAbiPath = path.join(__dirname, 'USDCSignatureLibAbi.json')

    // Now read the files
    const proxyCreationBytecode = fs.readFileSync(proxyCreationBytecodePath, 'utf8')
    const implCreationBytecode = fs.readFileSync(implCreationBytecodePath, 'utf8')
    const sigCreationBytecode = fs.readFileSync(sigCreationBytecodePath, 'utf8')

    const proxyAbi = JSON.parse(fs.readFileSync(proxyAbiPath, 'utf8'))
    const implAbi = JSON.parse(fs.readFileSync(implAbiPath, 'utf8'))
    const sigAbi = JSON.parse(fs.readFileSync(sigAbiPath, 'utf8'))

    const addressOne = '0x0000000000000000000000000000000000000001'

    logger.info(`Deploying USDC token ${symbol} (name ${name})`)

    // Deploy the SignatureChecker library contract with bytecode
    const signLibDeploymentName = getUSDCSignatureLibDeployName()
    logger.info(`Deploying USDC SignatureChecker library contract as ${signLibDeploymentName}`)
    const sigOverrides = {
        gasPrice: await hre.ethers.provider.getGasPrice(),
    }
    const signatureCheckerContractFactory = new ContractFactory(sigAbi, sigCreationBytecode, deployerSigner)
    // TODO commented out for now bc insufficient funds
    // const signatureCheckerLibDeployment = await signatureCheckerContractFactory.connect(usdcAdminSigner).deploy(sigOverrides)
    const signatureCheckerLib = await signatureCheckerContractFactory.deploy(sigOverrides)
    await signatureCheckerLib.deployed()
    await saveDeployment(
        hre,
        signLibDeploymentName,
        signatureCheckerLib,
        sigAbi,
        sigCreationBytecode,
        await hre.ethers.provider.getCode(signatureCheckerLib.address)
    )
    logger.info(`${signLibDeploymentName} is deployed: ${signatureCheckerLib.address}`)

    // Deploy implementation contract with bytecode
    const implDeploymentName = getUSDCImplDeployName()
    logger.info(`Deploying USDC implementation contract as ${implDeploymentName}`)
    // Link the SignatureChecker library into the implementation bytecode
    const implBytecodeWithLib = fillAddress(implCreationBytecode, signatureCheckerLib.address)
    const implOverrides = {
        ...feeData,
    }
    const implContractFactory = new ContractFactory(implAbi, implBytecodeWithLib, deployerSigner)
    // TODO commented out for now bc insufficient funds
    // const implTokenDeployment = await implContractFactory.connect(usdcAdminSigner).deploy(implOverrides)
    const implToken = await implContractFactory.deploy(implOverrides)
    await implToken.deployed()
    await saveDeployment(
        hre,
        implDeploymentName,
        implToken,
        implAbi,
        implBytecodeWithLib,
        await hre.ethers.provider.getCode(implToken.address)
    )
    logger.info(`${implDeploymentName} is deployed: ${implToken.address}`)

    console.log('is implToken newly deployed? ', implToken.newlyDeployed)

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
    logger.info(`Deploying USDC proxy contract as ${proxyDeploymentName}`)
    const proxyOverrides = {
        ...feeData,
    }

    const proxyBytecodeWithImplAddress = fillAddress(proxyCreationBytecode, implToken.address)

    const proxyContractFactory = new ContractFactory(proxyAbi, proxyBytecodeWithImplAddress, deployerSigner)
    // TODO commented out for now bc insufficient funds
    // const proxyDeployment = await proxyContractFactory.connect(usdcAdminSigner).deploy(implTokenDeployment.address, {
    //     ...proxyOverrides,
    //     gasLimit: 5000000,
    // })
    const proxy = await proxyContractFactory.deploy(implToken.address, {
        ...proxyOverrides,
        gasLimit: 50000000,
    })

    await proxy.deployed()

    await saveDeployment(
        hre,
        proxyDeploymentName,
        proxy,
        proxyAbi,
        proxyBytecodeWithImplAddress,
        await hre.ethers.provider.getCode(proxy.address)
    )

    logger.info(`${proxyDeploymentName} is deployed: ${proxy.address}`) // TODO Why is this not printing?
    logger.info(`${implDeploymentName} is deployed: ${implToken.address}`)

    console.log('logging proxy address then initializing: ', proxy.address)

    console.log('is proxy newly deployed? ', proxy.newlyDeployed)
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
