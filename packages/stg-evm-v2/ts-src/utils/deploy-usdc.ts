import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import axios from 'axios'
import { Contract, ContractFactory } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction, Deployment } from 'hardhat-deploy/dist/types'

import { createGetHreByEid, getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import { getUSDCImplDeployName, getUSDCProxyDeployName, getUSDCSignatureLibDeployName } from '../../ops/util'
import { CONTRACT_USDC_TAGS } from '../constants'

import { getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetNetworkConfigMaybe, getTokenConfig } from './util'

const appendTokenTags = appendTags(CONTRACT_USDC_TAGS)

const tokenName = TokenName.USDC
const API_KEY = process.env.ARB_API_KEY

const ARB_MAINNET = 'arbitrum-mainnet'

const ARB_SIG_ADDRESS = '0x4e7D093EE4d74a01905Cf5CA92eB0bf154a53247'
const ARB_PROXY_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const ARB_IMPL_ADDRESS = '0x86E721b43d4ECFa71119Dd38c0f938A75Fdb57B3'

const ARB_SIG_CREATION_TX_HASH = '0xcb1039e59342b82e8d9a02f7137e985c80a37c46185800916c7860b8d2408d3d'
const ARB_PROXY_CREATION_TX_HASH = '0xec773df8d80c83b23c74d0368f63d095f040c5fc6f9e749d0b429a7410c62662'
const ARB_IMPL_CREATION_TX_HASH = '0x69da94fb8281f6ed002071172c8b919c61d428afd3f2a0a06fd4f6ca125bb6ec'

// Replace placeholders in the bytecode with the actual library address
function linkLibrary(bytecode: string, libraryName: string, libraryAddress: string) {
    // Ensure the address is 40 characters long (without the 0x prefix)
    if (libraryAddress.slice(0, 2) === '0x') {
        libraryAddress = libraryAddress.slice(2)
    }
    if (libraryAddress.length !== 40) {
        throw new Error(`Invalid library address length for ${libraryName}`)
    }

    // Find the placeholder in the bytecode
    const placeholder = `__${libraryName}__`.padEnd(40, '_')
    while (bytecode.includes(placeholder)) {
        bytecode = bytecode.replace(placeholder, libraryAddress)
    }

    return bytecode
}

async function getCreationBytecodes(hre: HardhatRuntimeEnvironment) {
    const getEnvironment = createGetHreByEid(hre)
    const remoteEid = getEidForNetworkName(ARB_MAINNET)
    const remoteEnv = await getEnvironment(remoteEid)

    const sigCreationTx = await remoteEnv.ethers.provider.getTransaction(ARB_SIG_CREATION_TX_HASH)
    const proxyCreationTx = await remoteEnv.ethers.provider.getTransaction(ARB_PROXY_CREATION_TX_HASH)
    const implCreationTx = await remoteEnv.ethers.provider.getTransaction(ARB_IMPL_CREATION_TX_HASH)

    const sigCreationBytecode = sigCreationTx.data
    const proxyCreationBytecode = proxyCreationTx.data
    const implCreationBytecode = implCreationTx.data

    return { sigCreationBytecode, proxyCreationBytecode, implCreationBytecode }
}

async function getDeployedBytecodes(hre: HardhatRuntimeEnvironment) {
    const getEnvironment = createGetHreByEid(hre)
    const remoteEid = getEidForNetworkName(ARB_MAINNET)
    const remoteEnv = await getEnvironment(remoteEid)

    const sigDeployedBytecode = await remoteEnv.ethers.provider.getCode(ARB_SIG_ADDRESS)
    const proxyDeployedBytecode = await remoteEnv.ethers.provider.getCode(ARB_PROXY_ADDRESS)
    const implDeployedBytecode = await remoteEnv.ethers.provider.getCode(ARB_IMPL_ADDRESS)

    return { sigDeployedBytecode, proxyDeployedBytecode, implDeployedBytecode }
}

async function getAbis(logger: Logger) {
    let sigAbi = ''
    let proxyAbi = ''
    let implAbi = ''

    const sigUrl = `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=${ARB_SIG_ADDRESS}&apikey=${API_KEY}`
    const proxyUrl = `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=${ARB_PROXY_ADDRESS}&apikey=${API_KEY}`
    const implUrl = `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=${ARB_IMPL_ADDRESS}&apikey=${API_KEY}`

    try {
        let response = await axios.get(sigUrl)
        sigAbi = JSON.parse(response.data.result[0].ABI)

        response = await axios.get(proxyUrl)
        proxyAbi = JSON.parse(response.data.result[0].ABI)

        response = await axios.get(implUrl)
        implAbi = JSON.parse(response.data.result[0].ABI)
    } catch (error) {
        logger.error('Error fetching creation code:', error)
    }

    return { sigAbi, proxyAbi, implAbi }
}

async function saveDeployment(
    hre: HardhatRuntimeEnvironment,
    deploymentName: string,
    deploymentContract: Contract,
    abi: any,
    creationBytecode: string,
    deployedBytecpde: string
) {
    const sigDeployment: Deployment = {
        address: deploymentContract.address,
        abi: abi as any,
        transactionHash: deploymentContract.deployTransaction.hash,
        receipt: await deploymentContract.deployTransaction.wait(),
        args: [],
        bytecode: creationBytecode,
        deployedBytecode: deployedBytecpde,
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

    const { sigCreationBytecode, proxyCreationBytecode, implCreationBytecode } = await getCreationBytecodes(hre)
    const { sigDeployedBytecode, proxyDeployedBytecode, implDeployedBytecode } = await getDeployedBytecodes(hre)
    const { sigAbi, proxyAbi, implAbi } = await getAbis(logger)

    const addressOne = '0x0000000000000000000000000000000000000001'

    const signLibDeploymentName = getUSDCSignatureLibDeployName()
    const implDeploymentName = getUSDCImplDeployName()
    const proxyDeploymentName = getUSDCProxyDeployName()

    logger.info(`Deploying USDC token ${symbol} (name ${name})`)

    // Deploy the SignatureChecker library contract with bytecode
    logger.info(`Deploying USDC SignatureChecker library contract as ${signLibDeploymentName}`)

    const sigOverrides = {
        gasPrice: await hre.ethers.provider.getGasPrice(),
    }

    const signatureCheckerContractFactory = new ContractFactory(sigAbi, sigCreationBytecode, deployerSigner)

    // TODO commented out for now bc insufficient funds
    // const signatureCheckerLibDeployment = await signatureCheckerContractFactory.connect(usdcAdminSigner).deploy(sigOverrides)
    const signatureCheckerLibDeployment = await signatureCheckerContractFactory.deploy(sigOverrides)

    await signatureCheckerLibDeployment.deployed()
    await saveDeployment(
        hre,
        signLibDeploymentName,
        signatureCheckerLibDeployment,
        sigAbi,
        sigCreationBytecode,
        sigDeployedBytecode
    )

    logger.info(`${signLibDeploymentName} is deployed: ${signatureCheckerLibDeployment.address}`)

    // Deploy implementation contract with bytecode
    logger.info(`Deploying USDC implementation contract as ${implDeploymentName}`)

    // Link the SignatureChecker library into the implementation bytecode
    const linkedBytecode = linkLibrary(implCreationBytecode, 'SignatureChecker', signatureCheckerLibDeployment.address)

    const implOverrides = {
        ...feeData,
    }

    const implContractFactory = new ContractFactory(implAbi, linkedBytecode, deployerSigner)

    // TODO commented out for now bc insufficient funds
    // const implTokenDeployment = await implContractFactory.connect(usdcAdminSigner).deploy(implOverrides)
    const implTokenDeployment = await implContractFactory.deploy(implOverrides)

    await implTokenDeployment.deployed()
    await saveDeployment(
        hre,
        implDeploymentName,
        implTokenDeployment,
        implAbi,
        implCreationBytecode,
        implDeployedBytecode
    )

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
    }

    // const proxyContractFactory = new ContractFactory(proxyAbi, proxyBytecode, deployerSigner)
    const proxyContractFactory = new ContractFactory(proxyAbi, proxyCreationBytecode, deployerSigner)

    // TODO commented out for now bc insufficient funds
    // const proxyDeployment = await proxyContractFactory.connect(usdcAdminSigner).deploy(implTokenDeployment.address, {
    //     ...proxyOverrides,
    //     gasLimit: 5000000,
    // })
    const proxyDeployment = await proxyContractFactory.deploy(implTokenDeployment.address, {
        ...proxyOverrides,
        gasLimit: 90000000,
    })

    // console.log(`RAVINA Proxy deployment: ${JSON.stringify(proxyDeployment, null, 2)}`)

    const tx = await proxyDeployment.deployed()
    await saveDeployment(
        hre,
        proxyDeploymentName,
        proxyDeployment,
        proxyAbi,
        proxyCreationBytecode,
        proxyDeployedBytecode
    )

    // console.log(`RAVINA Proxy deployment tx: ${tx}`)

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
