/**
 * Common Contract Utilities
 *
 * This module provides common contract deployment and artifact utilities
 * that are used across multiple directories in the Stargate V2 ecosystem.
 */

/**
 * Gets deployment information for a contract from the deployments directory
 * @param npmPackage - The npm package name where deployments are located
 * @param contractName - The name of the contract
 * @param chainName - The chain name
 * @param environment - The environment (mainnet/testnet)
 * @param resolvePackagePath - Function to resolve and require the deployment file
 * @returns Object containing the contract address
 */
export const getContractDeploymentInfo = (
    npmPackage: string,
    contractName: string,
    chainName: string,
    environment: string,
    resolvePackagePath: (path: string) => { address: string }
): { address: string } => {
    const deploymentFolderName = `${chainName}-${environment}`
    return resolvePackagePath(`${npmPackage}/deployments/${deploymentFolderName}/${contractName}.json`)
}
