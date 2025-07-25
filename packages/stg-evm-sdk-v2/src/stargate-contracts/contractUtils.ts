/**
 * Contract Utilities for Stargate V2
 *
 * This module provides utilities for working with contract deployments and artifacts
 * in the Stargate V2 ecosystem. It supports both deployment-based contract resolution
 * (from the deployments/ directory) and artifact-based resolution (from artifacts/).
 *
 * Key Features:
 * - Cross-chain contract address resolution
 * - Contract instance creation with proper typing
 * - Support for ZK-Sync chains and standard EVM chains
 * - Fallback from deployments to artifacts for ABI/bytecode retrieval
 *
 * Usage Examples:
 *
 * ```typescript
 * import { createContractAddressGetter, createContractGetter } from './contractUtils'
 * import { TokenMessaging__factory } from './typechain'
 *
 * const resolvePackagePath = (path: string) => require(path)
 *
 * // Create an address getter
 * const getTokenMessagingAddress = createContractAddressGetter(
 *   '@stargatefinance/stg-evm-sdk-v2',
 *   'TokenMessaging',
 *   resolvePackagePath
 * )
 *
 * // Get contract address
 * const address = getTokenMessagingAddress('ethereum', 'mainnet')
 *
 * // Create a contract getter
 * const getTokenMessagingContract = createContractGetter(
 *   TokenMessaging__factory,
 *   '@stargatefinance/stg-evm-sdk-v2',
 *   'TokenMessaging',
 *   resolvePackagePath
 * )
 *
 * // Get contract instance
 * const contract = getTokenMessagingContract('ethereum', 'mainnet', provider)
 * ```
 */

import { StaticChainConfigs, throwError } from './utils'

import type { Provider } from '@ethersproject/providers'
import type { Signer } from 'ethers'

const getDeploymentFolderName = (chainName: string, environment: string): string => {
    if (['localnet', 'sandbox'].includes(environment)) {
        return chainName + '-sandbox-local'
    }
    return `${chainName}-${environment}`
}

const getChainSpecificContractArtifactPath = (chainName: string) => {
    if (StaticChainConfigs.isZKSyncChain(chainName)) {
        return 'artifacts-zk'
    }

    return 'artifacts'
}

// Contract paths mapping for bytecode retrieval from the artifacts directory
const evmContractBytecodePath: Record<string, (chainName: string) => string> = {
    TokenMessaging: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/messaging/TokenMessaging.sol/TokenMessaging.json`,
    CreditMessaging: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/messaging/CreditMessaging.sol/CreditMessaging.json`,
    StargatePool: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/StargatePool.sol/StargatePool.json`,
    StargatePoolNative: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/StargatePoolNative.sol/StargatePoolNative.json`,
    StargateOFT: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/StargateOFT.sol/StargateOFT.json`,
    StargateStaking: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/peripheral/rewarder/StargateStaking.sol/StargateStaking.json`,
    StargateMultiRewarder: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/peripheral/rewarder/StargateMultiRewarder.sol/StargateMultiRewarder.json`,
    Treasurer: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/peripheral/Treasurer.sol/Treasurer.json`,
    OFTWrapper: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/peripheral/oft-wrapper/OFTWrapper.sol/OFTWrapper.json`,

    // Fee libraries - extending for specific token fee libs
    FeeLibV1: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/feelibs/FeeLibV1.sol/FeeLibV1.json`,
    FeeLibV1ETH: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/feelibs/FeeLibV1.sol/FeeLibV1.json`,
    FeeLibV1USDC: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/feelibs/FeeLibV1.sol/FeeLibV1.json`,
    FeeLibV1USDT: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/feelibs/FeeLibV1.sol/FeeLibV1.json`,
    FeeLibV1mETH: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/feelibs/FeeLibV1.sol/FeeLibV1.json`,
    FeeLibV1METIS: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/feelibs/FeeLibV1.sol/FeeLibV1.json`,

    // Pool-specific contracts
    StargatePoolUSDC: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/usdc/StargatePoolUSDC.sol/StargatePoolUSDC.json`,
    StargatePoolUSDT: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/StargatePool.sol/StargatePool.json`,
    StargatePoolmETH: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/StargatePool.sol/StargatePool.json`,
    StargatePoolMETIS: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/StargatePool.sol/StargatePool.json`,

    // Utility libraries
    RewardRegistryLib: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/peripheral/rewarder/lib/RewardRegistryLib.sol/RewardRegistryLib.json`,
    RewardLib: (chainName: string) =>
        `${getChainSpecificContractArtifactPath(chainName)}/src/peripheral/rewarder/lib/RewardLib.sol/RewardLib.json`,
}

export const getEvmContractArtifact = (
    npmPackage: string,
    contractName: string,
    chainName: string,
    environment: string
): { abi: any[]; bytecode: string } => {
    const deploymentFolderName = getDeploymentFolderName(chainName, environment)
    let deploymentInfo:
        | {
              abi?: any[]
              bytecode?: string
          }
        | undefined

    try {
        deploymentInfo = require(`${npmPackage}/deployments/${deploymentFolderName}/${contractName}.json`)
    } catch (e) {
        // Deployment not found, will try artifact next
    }

    let artifact: { abi?: any[]; bytecode?: string } | undefined = undefined

    if (evmContractBytecodePath[contractName]) {
        try {
            // For this repo, we need to look in the stg-evm-v2 package for artifacts
            const artifactPath = evmContractBytecodePath[contractName](chainName)
            artifact = require(`@stargatefinance/stg-evm-v2/${artifactPath}`)
        } catch (e) {
            // Artifact not found
        }
    }

    return {
        abi: deploymentInfo?.abi ?? artifact?.abi ?? throwError('ABI not found'),
        bytecode: deploymentInfo?.bytecode ?? artifact?.bytecode ?? throwError('Bytecode not found'),
    }
}

export const getContractDeploymentInfo = (
    npmPackage: string,
    contractName: string,
    chainName: string,
    environment: string,
    resolvePackagePath: (path: string) => { address: string }
): { address: string } => {
    const deploymentFolderName = getDeploymentFolderName(chainName, environment)
    return resolvePackagePath(`${npmPackage}/deployments/${deploymentFolderName}/${contractName}.json`)
}

export const getEvmContractDeploymentAndArtifact = (
    npmPackage: string,
    contractName: string,
    chainName: string,
    environment: string,
    resolvePackagePath: (path: string) => { address: string }
): { address: string; abi: any[]; bytecode: string } => {
    const deploymentInfo = getContractDeploymentInfo(
        npmPackage,
        contractName,
        chainName,
        environment,
        resolvePackagePath
    )

    return {
        address: deploymentInfo.address ?? throwError('Address not found'),
        ...getEvmContractArtifact(npmPackage, contractName, chainName, environment),
    }
}

const getContractAddress = (
    npmPackage: string,
    contractName: string,
    chainName: string,
    environment: string,
    resolvePackagePath: (path: string) => { address: string }
): string => {
    return getContractDeploymentInfo(npmPackage, contractName, chainName, environment, resolvePackagePath).address
}

export function createContractAddressGetter(
    packageName: string,
    contractName: string,
    resolvePackagePath: (path: string) => { address: string },
    isSupportedChainPredicate: (chainName: string, environment: string) => boolean = () => true
): (chainName: string, environment: string) => string {
    return (chainName: string, environment: string) => {
        if (!isSupportedChainPredicate(chainName, environment)) {
            return ''
        }
        return getContractAddress(packageName, contractName, chainName, environment, resolvePackagePath).toLowerCase()
    }
}

export function createContractGetter<
    TFactory extends {
        connect(address: string, signerOrProvider: Signer | Provider): TInstance
    },
    TInstance = ReturnType<TFactory['connect']>,
>(
    factory: TFactory,
    packageName: string,
    contractName: string,
    resolvePackagePath: (path: string) => { address: string }
): (chainName: string, environment: string, provider: Signer | Provider) => TInstance {
    return (chainName: string, environment: string, provider: Signer | Provider) => {
        const address = getContractAddress(packageName, contractName, chainName, environment, resolvePackagePath)
        return factory.connect(address, provider)
    }
}
