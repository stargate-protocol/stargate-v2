import { JsonRpcProvider } from '@ethersproject/providers'

import { StargatePoolConfigGetter } from '../bootstrap-config'
import { ChainType, StaticChainConfigs } from '../stargate-contracts/utils'

import { StargateV2EvmSdk } from './evm'
import { ChainSdkFactory, STARGATEV2_SDK_DEFINITION, StargateV2Sdk } from './model'

import type { Logger } from 'winston'

export class StargateV2SdkFactory implements ChainSdkFactory<StargateV2Sdk> {
    definition = STARGATEV2_SDK_DEFINITION

    constructor(
        private options: {
            environment: string
            providers: { [chainName: string]: any }
            stargatePoolConfigGetter: StargatePoolConfigGetter
            logger: Logger | Console
        }
    ) {}

    getSdk(chainName: string): StargateV2Sdk {
        const chainType = StaticChainConfigs.getChainType(chainName)
        switch (chainType) {
            case ChainType.EVM: {
                return new StargateV2EvmSdk({
                    ...this.options,
                    provider: this.options.providers[chainName] as JsonRpcProvider,
                    chainName,
                })
            }
            default: {
                throw new Error(`Unsupported chain type: ${chainType}`)
            }
        }
    }
}
