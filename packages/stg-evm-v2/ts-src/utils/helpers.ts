import { DeployFunction } from 'hardhat-deploy/dist/types'

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
    // TODO write tests for this function
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
