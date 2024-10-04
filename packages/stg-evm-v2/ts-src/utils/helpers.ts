import assert from 'assert'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract, ContractFactory } from 'ethers'
import { HardhatRuntimeEnvironment, Libraries } from 'hardhat/types'
import { ABI, DeployFunction, Deployment } from 'hardhat-deploy/dist/types'

import { Logger } from '@layerzerolabs/io-devtools'

/**
 * Helper function that appends tags to a `DeployFunction`
 * in a functional way
 *
 * @param {string[]} tags
 */
export const appendTags =
    (tags: string[]) =>
    (deploy: DeployFunction): DeployFunction => ((deploy.tags = [...(deploy.tags ?? []), ...tags]), deploy)

/**
 * Helper function that appends dependencies to a `DeployFunction`
 * in a functional way
 *
 * @param {string[]} dependencies
 */
export const appendDependencies =
    (dependencies: string[]) =>
    (deploy: DeployFunction): DeployFunction => (
        (deploy.dependencies = [...(deploy.dependencies ?? []), ...dependencies]), deploy
    )

/**
 * Helper function that replaces any $ placeholders in str with the provided address
 * @param str The string with placeholders
 * @param address The address to replace the placeholders with
 * @returns str with placeholders replaced with address
 */
export const fillAddress = (str: string, address: string) => {
    const normalizedAddress = address.replace(/^0x/, '')
    assert(normalizedAddress.length === 40, `Invalid library address length for ${address}`)

    return str.replace(/\$/g, normalizedAddress)
}

/**
 * Helper function that saves deployment information to the deployments folder
 * @returns the saved deployment
 */
export const saveDeployment = async ({
    hre,
    deploymentName,
    deploymentContract,
    abi,
    creationBytecode,
    deployedBytecode,
    libraries,
    args = [],
    metadata,
}: {
    hre: HardhatRuntimeEnvironment
    deploymentName: string
    deploymentContract: Contract
    abi: ABI
    creationBytecode: string
    deployedBytecode: string
    libraries?: Libraries
    args?: unknown[]
    metadata: string
}) => {
    const deployment: Deployment = {
        address: deploymentContract.address,
        abi,
        transactionHash: deploymentContract.deployTransaction.hash,
        args,
        bytecode: creationBytecode,
        deployedBytecode: deployedBytecode,
        libraries: libraries ?? {},
        metadata,
    }

    await hre.deployments.save(deploymentName, deployment)

    return deployment
}

/**
 * Helper function that deploys a contract and saves the deployment information
 * @returns the saved deployment
 */
export const deploy = async ({
    hre,
    contractName,
    deploymentName,
    overrides,
    abi,
    creationBytecode,
    signer,
    logger,
    libraries,
    args = [],
    metadata,
}: {
    hre: HardhatRuntimeEnvironment
    contractName: string
    deploymentName: string
    overrides: object
    abi: ABI
    creationBytecode: string
    signer: SignerWithAddress
    logger: Logger
    libraries?: Libraries
    args?: unknown[]
    metadata: string
}) => {
    const existingDeployment = await hre.deployments.getOrNull(deploymentName)

    if (existingDeployment?.bytecode !== creationBytecode) {
        logger.info(`Deploying contract ${contractName} as ${deploymentName}`)

        const contractFactory = new ContractFactory(abi, creationBytecode, signer)

        const contract = await contractFactory.deploy(...args, overrides)

        await contract.deployed()

        const contractDeployment = await saveDeployment({
            hre,
            deploymentName,
            deploymentContract: contract,
            abi,
            creationBytecode,
            deployedBytecode: await hre.ethers.provider.getCode(contract.address),
            libraries,
            args,
            metadata,
        })

        console.log(`${deploymentName} is deployed: ${contract.address}`)
        return { ...contractDeployment, newlyDeployed: true }
    } else {
        console.log(`${deploymentName} is already deployed: ${existingDeployment.address}`)
        return { ...existingDeployment, newlyDeployed: false }
    }
}
