import { getContractDeploymentInfo } from '../common-utils'

import type { Provider } from '@ethersproject/providers'
import type { Signer } from 'ethers'

export function createContractGetter<
    TFactory extends {
        connect(address: string, signerOrProvider: Signer | Provider): TInstance
    },
    TInstance = ReturnType<TFactory['connect']>,
>(
    factory: TFactory,
    packageName: string,
    contractName: string,
    resolvePackagePath: (path: string) => { address: string }
): (chainName: string, environment: string, provider: Signer | Provider) => TInstance {
    return (chainName: string, environment: string, provider: Signer | Provider) => {
        const address = getContractDeploymentInfo(
            packageName,
            contractName,
            chainName,
            environment,
            resolvePackagePath
        ).address
        return factory.connect(address, provider)
    }
}
