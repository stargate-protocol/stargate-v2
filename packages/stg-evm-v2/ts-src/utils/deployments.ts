import assert from 'assert'

import { type BigNumber } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployResult, Deployment, Libraries } from 'hardhat-deploy/dist/types'

import { areBytes32Equal } from '@layerzerolabs/devtools'
import { createModuleLogger, printJson } from '@layerzerolabs/io-devtools'

export interface DeployOptions {
    from: string
    contract?: string
    args?: unknown[]
    log?: boolean
    libraries?: Libraries
    waitConfirmations?: number
    skipIfAlreadyDeployed?: boolean
    gasLimit?: string | number | BigNumber
    gasPrice?: string | BigNumber
    maxFeePerGas?: string | BigNumber
    maxPriorityFeePerGas?: string | BigNumber
    nonce?: string | number | BigNumber
}

export type Deploy = (deploymentName: string, options: DeployOptions) => Promise<DeployResult>

export const createDeploy = (hre: HardhatRuntimeEnvironment): Deploy => {
    if (!hre.network.zksync) return hre.deployments.deploy

    return async (deploymentName, options) => {
        const logger = createModuleLogger(`zkSync deployer for ${deploymentName}`)
        logger.info(`Deploying`)

        logger.info(`Checking existing deployments`)
        const existingDeployment = await hre.deployments.getOrNull(deploymentName)
        if (existingDeployment != null) {
            return logger.info(`Found existing deployment, skipping`), { ...existingDeployment, newlyDeployed: false }
        }

        const signers = await hre.ethers.getSigners()
        const signerIndex = signers.findIndex((signer) => areBytes32Equal(signer.address, options.from))

        logger.info(`Using signer ${options.from} at index ${signerIndex}`)

        assert(signerIndex != -1, `Could not find signer index for ${options.from}`)

        const wallet = await hre.deployer.getWallet(signerIndex)
        hre.deployer.setWallet(wallet)

        const contractName = options.contract ?? deploymentName
        const artifact = await hre.deployer.loadArtifact(contractName)
        const args = options.args ?? []

        logger.info(`Using args ${printJson(args)}`)

        logger.info(`Estimating deployment cost`)

        const deploymentFee = await hre.deployer.estimateDeployFee(artifact, args)
        logger.info(`Estimated deployment cost: ${formatEther(deploymentFee)} ETH`)

        const contract = await hre.deployer.deploy(artifact, args, {
            gasLimit: options.gasLimit,
            gasPrice: options.gasPrice,
            maxFeePerGas: options.maxFeePerGas,
            maxPriorityFeePerGas: options.maxPriorityFeePerGas,
            nonce: options.nonce,
        })

        // FIXME zkSync deployer seems to be saving a deployment but under a wrong name
        logger.info(`Saving deployment`)

        const deployment: Deployment = {
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

        return { ...deployment, newlyDeployed: true }
    }
}

export interface FeeData {
    maxFeePerGas?: BigNumber
    maxPriorityFeePerGas?: BigNumber
}

export const getFeeData = async (hre: HardhatRuntimeEnvironment): Promise<FeeData> => {
    const logger = createModuleLogger('fee data')

    if (!hre.network.config.useFeeData) {
        return logger.info(`Skipping fee data for network ${hre.network.name}`), {}
    }

    try {
        const feeData = await hre.ethers.provider.getFeeData()

        return {
            maxFeePerGas: feeData.maxFeePerGas ?? undefined,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
        }
    } catch (error) {
        logger.warn(`Failed to get gas fee data: ${error}`)

        return {}
    }
}
