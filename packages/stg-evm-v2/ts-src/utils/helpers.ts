import { Contract } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction, Deployment } from 'hardhat-deploy/dist/types'

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

/**
 * export interface DeploymentSubmission {
  abi: ABI;
  address: Address; // used to override receipt.contractAddress (useful for proxies)
  receipt?: Receipt;
  transactionHash?: string;
  history?: Deployment[];
  implementation?: string;
  args?: any[];
  linkedData?: any;
  solcInput?: string;
  solcInputHash?: string;
  metadata?: string;
  bytecode?: string;
  deployedBytecode?: string;
  userdoc?: any;
  devdoc?: any;
  methodIdentifiers?: any;
  facets?: Facet[];
  execute?: {
    methodName: string;
    args: any[];
  };
  storageLayout?: any;
  libraries?: Libraries;
  gasEstimates?: any;
  factoryDeps?: string[];
}
 */
