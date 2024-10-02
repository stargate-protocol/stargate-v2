import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract, ContractFactory } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
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

// Utility to replace any $ in bytecode with the address
export const fillAddress = (bytecode: string, address: string) => {
    // Ensure the address is 40 characters long (without the 0x prefix)
    if (address.slice(0, 2) === '0x') {
        address = address.slice(2)
    }
    if (address.length !== 40) {
        throw new Error(`Invalid library address length ${address}`)
    }

    // Find the placeholder in the bytecode
    const placeholder = `$`
    while (bytecode.includes(placeholder)) {
        bytecode = bytecode.replace(placeholder, address)
    }

    return bytecode
}

// Saves deployment information to the deployments folder
export const saveDeployment = async (
    hre: HardhatRuntimeEnvironment,
    deploymentName: string,
    deploymentContract: Contract,
    abi: any,
    creationBytecode: string,
    deployedBytecode: string // TODO add optional libraries
) => {
    const deployment: Deployment = {
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
            sources: {}, // TODO pull from solc input in hardcoded files
        }),
    }

    await hre.deployments.save(deploymentName, deployment)
}

export const deploy = async (
    hre: HardhatRuntimeEnvironment,
    deploymentName: string,
    overrides: object,
    abi: any,
    creationBytecode: string,
    signer: SignerWithAddress,
    logger: Logger
) => {
    logger.info(`Deploying ${deploymentName}`)

    const contractFactory = new ContractFactory(abi, creationBytecode, signer)

    // TODO commented out for now bc insufficient funds
    // const contractFactory = await contractFactory.connect(signer).deploy(overrides)
    const contract = await contractFactory.deploy(overrides)

    await contract.deployed()

    await saveDeployment(
        hre,
        deploymentName,
        contract,
        abi,
        creationBytecode,
        await hre.ethers.provider.getCode(contract.address)
    )

    logger.info(`${deploymentName} is deployed: ${contract.address}`)

    return contract
}

// TODO move hardcoded data to 3 json files at end with bytecode and solc input and abi (get solc input from api most likley)
// TODO see verifier alliance for database of solc input
