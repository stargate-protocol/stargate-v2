import assert from 'assert'

import { ExecutorOptionType, Options } from '@layerzerolabs/lz-v2-utilities'
import {
    ExecutorComposeOption,
    ExecutorLzReceiveOption,
    ExecutorNativeDropOption,
    ExecutorOrderedExecutionOption,
    OAppEnforcedOption,
} from '@layerzerolabs/ua-devtools'

export function decodeEnforcedOptions(options: Options, msgType: number): OAppEnforcedOption[] {
    const decodedLzReceive = options.decodeExecutorLzReceiveOption()
    const lzReceiveOption: ExecutorLzReceiveOption | undefined = decodedLzReceive
        ? {
              gas: decodedLzReceive.gas,
              value: decodedLzReceive.value,
              optionType: ExecutorOptionType.LZ_RECEIVE,
              msgType: msgType,
          }
        : undefined
    const decodedNativeDrop = options.decodeExecutorNativeDropOption()
    const lzNativeDropOption: ExecutorNativeDropOption[] = decodedNativeDrop
        ? decodedNativeDrop.map(({ amount, receiver }) => {
              return {
                  amount: amount,
                  receiver: receiver,
                  optionType: ExecutorOptionType.NATIVE_DROP,
                  msgType: msgType,
              }
          })
        : []
    const decodedCompose = options.decodeExecutorComposeOption()
    const lzComposeOption: ExecutorComposeOption[] = decodedCompose
        ? decodedCompose.map(({ index, gas, value }) => {
              return {
                  index: index,
                  gas: gas,
                  value: value,
                  optionType: ExecutorOptionType.COMPOSE,
                  msgType: msgType,
              }
          })
        : []
    const decodedOrderedExecution = options.decodeExecutorOrderedExecutionOption()
    const lzOrderedExecutionOption: ExecutorOrderedExecutionOption | undefined = decodedOrderedExecution
        ? {
              optionType: ExecutorOptionType.ORDERED,
              msgType: msgType,
          }
        : undefined

    const retValue = [lzReceiveOption, ...lzNativeDropOption, ...lzComposeOption, lzOrderedExecutionOption].filter(
        (option) => option
    ) as OAppEnforcedOption[]
    assert(retValue, 'Unknown enforced option type')

    return retValue
}
