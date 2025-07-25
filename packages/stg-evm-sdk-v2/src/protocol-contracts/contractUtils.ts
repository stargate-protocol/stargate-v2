import { getContractDeploymentInfo } from '../stargate-contracts/contractUtils' // TODO this should be in a common-utils file

import type { Provider } from '@ethersproject/providers'
import type { Signer } from 'ethers'

export const getLZContractAddress = (
    contractName: string,
    chainName: string,
    environment: string,
    resolvePackagePath: (address: string) => { address: string }
): string => {
    // Only support Executor contract - get address directly from LayerZero SDK
    if (contractName === 'Executor') {
        const npmPackage = '@layerzerolabs/lz-evm-sdk-v2'
        const addressFromArtifact = getContractDeploymentInfo(
            npmPackage,
            contractName,
            chainName,
            environment,
            resolvePackagePath
        ).address

        return addressFromArtifact
    }

    // Throw error for any other contract name
    throw new Error(
        `Contract "${contractName}" is not supported. Only "Executor" contract is supported by this refactored implementation.`
    )
}

export const createLZContractAddressGetter = (
    contractName: string,
    resolvePackagePath: (address: string) => { address: string }
) => {
    return (chainName: string, environment: string) => {
        return getLZContractAddress(contractName, chainName, environment, resolvePackagePath).toLowerCase()
    }
}

export function createLZContractGetter<
    TFactory extends {
        connect(address: string, signerOrProvider: Signer | Provider): TInstance
    },
    TInstance = ReturnType<TFactory['connect']>,
>(
    factory: TFactory,
    contractName: string,
    resolvePackagePath: (address: string) => { address: string }
): (chainName: string, environment: string, provider: Signer | Provider) => TInstance {
    return (chainName: string, environment: string, provider: Signer | Provider) => {
        const address = getLZContractAddress(contractName, chainName, environment, resolvePackagePath)
        return factory.connect(address, provider)
    }
}
