import { JsonRpcProvider } from '@ethersproject/providers'

import { StargatePoolConfigGetter } from '../bootstrap-config'

import { StargateV2EvmSdk } from './evm'
import { StargateV2Sdk } from './model'

import type { Logger } from 'winston'

export class StargateV2SdkFactory {
    constructor(
        private options: {
            environment: string
            providers: { [chainName: string]: any }
            stargatePoolConfigGetter: StargatePoolConfigGetter
            logger: Logger | Console
        }
    ) {}

    getSdk(chainName: string): StargateV2Sdk {
        // All chains in this repo are EVM-based
        return new StargateV2EvmSdk({
            ...this.options,
            provider: this.options.providers[chainName] as JsonRpcProvider,
            chainName,
        })
    }
}
