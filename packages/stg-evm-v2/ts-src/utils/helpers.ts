import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract, ContractFactory } from 'ethers'
import { HardhatRuntimeEnvironment, Libraries } from 'hardhat/types'
import { DeployFunction, Deployment } from 'hardhat-deploy/dist/types'

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

// Utility to replace any $ in str with the address
export const fillAddress = (str: string, address: string) => {
    // Ensure the address is 40 characters long (without the 0x prefix)
    if (address.slice(0, 2) === '0x') {
        address = address.slice(2)
    }
    if (address.length !== 40) {
        throw new Error(`Invalid library address length ${address}`)
    }

    // Find the placeholder in the bytecode
    const placeholder = `$`
    while (str.includes(placeholder)) {
        str = str.replace(placeholder, address)
    }

    return str
}

// Saves deployment information to the deployments folder
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
    abi: any
    creationBytecode: string
    deployedBytecode: string
    libraries?: Libraries
    args?: any[]
    metadata: string
}) => {
    const deployment: Deployment = {
        address: deploymentContract.address,
        abi: abi as any,
        transactionHash: deploymentContract.deployTransaction.hash,
        receipt: await deploymentContract.deployTransaction.wait(),
        args,
        bytecode: creationBytecode,
        deployedBytecode: deployedBytecode,
        libraries: libraries ?? {},
        metadata,
    }

    await hre.deployments.save(deploymentName, deployment)

    return deployment
}

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
    hre: HardhatRuntimeEnvironment // TODO review this file
    contractName: string
    deploymentName: string
    overrides: object
    abi: any
    creationBytecode: string
    signer: SignerWithAddress
    logger: Logger
    libraries?: Libraries
    args?: any[]
    metadata: string
}) => {
    const existingDeployment = await hre.deployments.getOrNull(deploymentName)

    if (existingDeployment?.bytecode !== creationBytecode) {
        logger.info(`Deploying contract ${contractName} as ${deploymentName}`)

        const contractFactory = new ContractFactory(abi, creationBytecode, signer)

        let contract: Contract
        if (args) {
            contract = await contractFactory.deploy(...args, overrides)
        } else {
            contract = await contractFactory.deploy(overrides)
        }

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

        logger.info(`${deploymentName} is deployed: ${contract.address}`) // TODO weird issue where this does not print for last contract deployed (proxy in this case)

        return { ...contractDeployment, newlyDeployed: true }
    } else {
        logger.info(`${deploymentName} is already deployed: ${existingDeployment.address}`)
        return { ...existingDeployment, newlyDeployed: false }
    }
}
