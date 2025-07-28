import { getContractDeploymentInfo } from '../common-utils'

import type { Provider } from '@ethersproject/providers'
import type { Signer } from 'ethers'

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
        // Only support Executor contract - get address directly from LayerZero SDK
        if (contractName !== 'Executor') {
            throw new Error(
                `Contract "${contractName}" is not supported. Only "Executor" contract is supported by this implementation.`
            )
        }

        const npmPackage = '@layerzerolabs/lz-evm-sdk-v2'
        const address = getContractDeploymentInfo(
            npmPackage,
            contractName,
            chainName,
            environment,
            resolvePackagePath
        ).address

        return factory.connect(address, provider)
    }
}
