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

export const throwError = <Err extends Error>(message: string, error?: (message: string) => Err): never => {
    throw error?.(message) ?? new Error(message)
}
