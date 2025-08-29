import { Executor__factory } from './typechain'
import { createLZContractGetter } from './utils'

export * from './typechain'

const resolvePackagePath = (address: string): { address: string } => {
    return require(address)
}

export const getExecutorContract = createLZContractGetter(Executor__factory, 'Executor', resolvePackagePath)
