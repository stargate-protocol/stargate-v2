import assert from 'assert'

import { ASSETS, StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { createERC20Factory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { createConnectedContractFactory, getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger, printRecord } from '@layerzerolabs/io-devtools'

import { CONTRACT_MOCKERC20_TAGS, CONTRACT_STARGATE_TAGS } from '..'
import {
    getNativePoolAssetDeploymentName,
    getOFTAssetDeploymentName,
    getPoolAssetDeploymentName,
    getTokenDeployName,
} from '../../ops/util'

import { createDeploy, getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetTypeMaybe, getTokenConfig } from './util'

const appendAssetTags = appendTags(CONTRACT_STARGATE_TAGS)
const appendAssetDependencies = appendTags(CONTRACT_MOCKERC20_TAGS)

interface CreateDeployAssetOptions {
    tokenName: TokenName
    /**
     * Name of the local deployment of a token contract.
     *
     * This will be used if no external token address has been configured.
     *
     * @default getTokenDeployName(tokenName, stargateType)
     */
    tokenDeploymentName?: string
}

/**
 * Creates a deploy function for a particular token,
 * identified by its `TokenName`
 *
 * @param {DeployAssetOptions} options
 * @returns {DeployFunction}
 */
export const createDeployAsset = ({ tokenName, tokenDeploymentName }: CreateDeployAssetOptions): DeployFunction =>
    appendAssetTags(
        appendAssetDependencies(async (hre: HardhatRuntimeEnvironment) => {
            // First let's get some basic info
            const network = hre.network.name
            const eid = getEidForNetworkName(network)
            const stargateType = getAssetTypeMaybe(eid, tokenName)

            const logger = createModuleLogger(`Asset Deployer ${tokenName} @ ${network}`)
            logger.info(`Deploying ...`)

            // Let's make sure we have configuration for this token
            const tokenConfig = ASSETS[tokenName]
            if (tokenConfig == null) {
                return logger.warn(`Skipping deployment: no configuration`), undefined
            }

            if (stargateType == null) {
                return logger.warn(`Skipping deployment: no asset type`), undefined
            }

            // We'll need the token configuration
            const tokenProperties = getTokenConfig(eid, tokenName)

            // If we are deploying a native pool, it's quite straightforward
            if (stargateType === StargateType.Native) {
                return deployNativePoolAsset(hre, logger, {
                    ...tokenProperties,
                    tokenDecimals: 18,
                })
            }

            const deploymentName = tokenDeploymentName ?? getTokenDeployName(tokenName, stargateType)

            // For the Pool & OFT we're gonna need some more information
            const tokenAddress =
                // We'll grab the token address either from the config (i.e. it's an external token)
                tokenProperties.address ??
                // Or from local deployments if that fails
                //
                // For this we need to also grab the name under which this token should exist
                (logger.info(`Looking for internal token address for ${deploymentName}`),
                await getInternalTokenAddress(hre, deploymentName, logger))

            assert(tokenAddress, `Missing pool token address for ${tokenName} on ${network}`)

            // Now we get the token decimals
            logger.info(`Getting token decimals for token at address ${tokenAddress}`)
            const erc20Factory = createERC20Factory(createConnectedContractFactory())
            const tokenSdk = await erc20Factory({ eid, address: tokenAddress, contractName: 'ERC20' })
            const tokenDecimals = await tokenSdk.decimals()

            switch (stargateType) {
                case StargateType.Pool:
                    return deployPoolAsset(hre, logger, {
                        ...tokenProperties,
                        contractName: getPoolContractName(tokenName),
                        deploymentName: getPoolAssetDeploymentName(tokenName),
                        tokenAddress,
                        tokenDecimals,
                    })

                case StargateType.Oft:
                    return deployOFTAsset(hre, logger, {
                        ...tokenProperties,
                        contractName: getOFTContractName(tokenName),
                        deploymentName: getOFTAssetDeploymentName(tokenName),
                        tokenAddress,
                    })
            }
        })
    )

// For OFT we use the same contract for every token except USDC since it has a different minter interface
const getOFTContractName = (tokenName: TokenName): 'StargateOFTUSDC' | 'StargateOFT' => {
    return tokenName === 'USDC' ? 'StargateOFTUSDC' : 'StargateOFT'
}

const getPoolContractName = (tokenName: TokenName): 'StargatePoolUSDC' | 'StargatePool' | 'StargatePoolMigratable' => {
    if (tokenName === 'USDC') {
        return 'StargatePoolUSDC'
    }
    if (tokenName === 'USDT') {
        return 'StargatePoolMigratable'
    }

    return 'StargatePool'
}

/**
 * Helper function that grabs a token address from local deployments
 *
 * @param {HardhatRuntimeEnvironment} hre
 * @param {string} tokenDeploymentName The name under which this token should have been deployed
 * @returns {promise<string | undefined>} Address of an external token or undefined if this token has not been deployed
 */
const getInternalTokenAddress = async (
    hre: HardhatRuntimeEnvironment,
    tokenDeploymentName: string,
    logger: Logger
): Promise<string | undefined> => {
    logger.info(`Looking for token address for ${tokenDeploymentName}`)

    const tokenDeployment = await hre.deployments.getOrNull(tokenDeploymentName)
    if (tokenDeployment == null) {
        return logger.warn(`Could not find token address for ${tokenDeploymentName}`), undefined
    }

    logger.info(`Found for token address for ${tokenDeploymentName}: ${tokenDeployment.address}`)

    return tokenDeployment.address
}

interface DeployOFTAssetOptions {
    contractName: 'StargateOFTUSDC' | 'StargateOFT'
    deploymentName: string
    tokenAddress: string
    sharedDecimals: number
}

const deployOFTAsset = async (
    hre: HardhatRuntimeEnvironment,
    logger: Logger,
    { contractName, deploymentName, tokenAddress, sharedDecimals }: DeployOFTAssetOptions
) => {
    const { deployer } = await hre.getNamedAccounts()
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)

    // Let's get em EndpointV2 deployment properties
    //
    const endpointAddress = await getEndpointV2Address(hre, logger)

    // Let the world know we're doing something
    logger.info(
        `\n${printRecord({
            Asset: deploymentName,
            Contract: contractName,
            Deployer: deployer,
            Endpoint: endpointAddress,
            'Shared Decimals': sharedDecimals,
        })}`
    )

    await deploy(deploymentName, {
        contract: contractName,
        from: deployer,
        args: [tokenAddress, sharedDecimals, endpointAddress, deployer],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

interface DeployNativePoolAssetOptions {
    deploymentName?: string
    symbol: string
    sharedDecimals: number
    tokenDecimals: number
}

const deployNativePoolAsset = async (
    hre: HardhatRuntimeEnvironment,
    logger: Logger,
    {
        deploymentName = getNativePoolAssetDeploymentName(),
        symbol,
        sharedDecimals,
        tokenDecimals,
    }: DeployNativePoolAssetOptions
) => {
    const contractName = 'StargatePoolNative'
    const { deployer } = await hre.getNamedAccounts()
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)

    // Let's get em EndpointV2 deployment properties
    //
    const endpointAddress = await getEndpointV2Address(hre, logger)

    // Let the world know we're doing something
    logger.info(
        `\n${printRecord({
            Asset: deploymentName,
            Contract: contractName,
            Deployer: deployer,
            Endpoint: endpointAddress,
            'Token Symbol': symbol,
            'Shared Decimals': sharedDecimals,
            'Token Decimals': tokenDecimals,
        })}`
    )

    await deploy(deploymentName, {
        from: deployer,
        contract: contractName,
        args: [
            `${symbol}-LP`, // LP Token Name
            `S*${symbol}`, // LP Token Symbol
            tokenDecimals,
            sharedDecimals,
            endpointAddress,
            deployer,
        ],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

interface DeployPoolAssetOptions {
    contractName: 'StargatePoolUSDC' | 'StargatePool' | 'StargatePoolMigratable'
    deploymentName: string
    tokenAddress: string
    symbol: string
    sharedDecimals: number
    tokenDecimals: number
}

const deployPoolAsset = async (
    hre: HardhatRuntimeEnvironment,
    logger: Logger,
    { contractName, deploymentName, tokenAddress, symbol, sharedDecimals, tokenDecimals }: DeployPoolAssetOptions
) => {
    const { deployer } = await hre.getNamedAccounts()
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)

    // Let's get em EndpointV2 deployment properties
    //
    const endpointAddress = await getEndpointV2Address(hre, logger)

    // Let the world know we're doing something
    logger.info(
        `\n${printRecord({
            Asset: deploymentName,
            Contract: contractName,
            Deployer: deployer,
            Endpoint: endpointAddress,
            'Token Address': tokenAddress,
            'Token Symbol': symbol,
            'Shared Decimals': sharedDecimals,
            'Token Decimals': tokenDecimals,
        })}`
    )

    await deploy(deploymentName, {
        contract: contractName,
        from: deployer,
        args: [
            `${symbol}-LP`, // LP Token Name
            `S*${symbol}`, // LP Token Symbol
            tokenAddress,
            tokenDecimals,
            sharedDecimals,
            endpointAddress,
            deployer,
        ],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

const getEndpointV2Address = async (hre: HardhatRuntimeEnvironment, logger: Logger) => {
    logger.info(`Looking for EndpointV2 address`)

    const deployment = await hre.deployments.get('EndpointV2')

    logger.info(`Found EndpointV2 address: ${deployment.address}`)

    return deployment.address
}
