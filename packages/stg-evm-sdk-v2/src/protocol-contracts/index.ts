import { getEvmContractArtifact } from '../stargate-contracts/contractUtils'

import { createLZContractAddressGetter, createLZContractGetter } from './contractUtils'
import {
    AxelarDVNAdapterFeeLib__factory,
    AxelarDVNAdapter__factory,
    EndpointV2View__factory,
    EndpointV2__factory,
    Executor__factory,
    OmniCounter__factory,
    PriceFeed__factory,
    ProxyAdmin__factory,
    ReadLib1002View__factory,
    ReadLib1002__factory,
    ReceiveUln301View__factory,
    ReceiveUln301__factory,
    ReceiveUln302View__factory,
    ReceiveUln302__factory,
    SendLibBaseE1__factory,
    SendUln301__factory,
    SendUln302__factory,
    SimpleMessageLib__factory,
    Treasury__factory,
} from './typechain'

export * from './typechain'

const PACKAGE_NAME = '@layerzerolabs/lz-evm-sdk-v2'

const resolvePackagePath = (address: string): { address: string } => {
    return require(address)
}

export const getSimpleMessageLibContract = createLZContractGetter(
    SimpleMessageLib__factory,
    'SimpleMessageLib',
    resolvePackagePath
)

export const getSimpleMessageLibContractAddress = createLZContractAddressGetter('SimpleMessageLib', resolvePackagePath)

export const getReceiveUln302Contract = createLZContractGetter(
    ReceiveUln302__factory,
    'ReceiveUln302',
    resolvePackagePath
)

export const getReceiveUln302ContractAddress = createLZContractAddressGetter('ReceiveUln302', resolvePackagePath)

export const getReceiveUln302ViewContract = createLZContractGetter(
    ReceiveUln302View__factory,
    'ReceiveUln302View',
    resolvePackagePath
)

export const getTreasuryContract = createLZContractGetter(Treasury__factory, 'Treasury', resolvePackagePath)

export const getReceiveUln302ViewContractAddress = createLZContractAddressGetter(
    'ReceiveUln302View',
    resolvePackagePath
)

export const getReceiveUln301Contract = createLZContractGetter(
    ReceiveUln301__factory,
    'ReceiveUln301',
    resolvePackagePath
)

export const getReceiveUln301ContractAddress = createLZContractAddressGetter('ReceiveUln301', resolvePackagePath)

export const getReceiveUln301ViewContract = createLZContractGetter(
    ReceiveUln301View__factory,
    'ReceiveUln301View',
    resolvePackagePath
)

export const getReceiveUln301ViewContractAddress = createLZContractAddressGetter(
    'ReceiveUln301View',
    resolvePackagePath
)

export const getSendUln302Contract = createLZContractGetter(SendUln302__factory, 'SendUln302', resolvePackagePath)

export const getSendUln302ContractAddress = createLZContractAddressGetter('SendUln302', resolvePackagePath)

export const getSendUln301Contract = createLZContractGetter(SendUln301__factory, 'SendUln301', resolvePackagePath)

export const getSendUln301ContractAddress = createLZContractAddressGetter('SendUln301', resolvePackagePath)

export const getDVNContractAddress = createLZContractAddressGetter('DVN', resolvePackagePath)

export const getEndpointV2Contract = createLZContractGetter(EndpointV2__factory, 'EndpointV2', resolvePackagePath)

export const getReadLib1002ViewContract = createLZContractGetter(
    ReadLib1002View__factory,
    'ReadLib1002View',
    resolvePackagePath
)

export const getReadLib1002ViewContractAddress = createLZContractAddressGetter('ReadLib1002View', resolvePackagePath)

export const getReadLib1002Contract = createLZContractGetter(ReadLib1002__factory, 'ReadLib1002', resolvePackagePath)

export const getReadLib1002ContractAddress = createLZContractAddressGetter('ReadLib1002', resolvePackagePath)

export const getEndpointV2ContractAddress = createLZContractAddressGetter('EndpointV2', resolvePackagePath)

export const getEndpointV2ViewContract = createLZContractGetter(
    EndpointV2View__factory,
    'EndpointV2View',
    resolvePackagePath
)

export const getEndpointV2ContractViewAddress = createLZContractAddressGetter('EndpointV2View', resolvePackagePath)

export const getPriceFeedContract = createLZContractGetter(PriceFeed__factory, 'PriceFeed', resolvePackagePath)

export const getPriceFeedContractAddress = createLZContractAddressGetter('PriceFeed', resolvePackagePath)

export const getExecutorContract = createLZContractGetter(Executor__factory, 'Executor', resolvePackagePath)

export const getExecutorContractAddress = createLZContractAddressGetter('Executor', resolvePackagePath)

export const getExecutorProxyContractAddress = createLZContractAddressGetter('Executor_Proxy', resolvePackagePath)

export const getExecutorProxyAdminContract = createLZContractGetter(
    ProxyAdmin__factory,
    'ExecutorProxyAdmin',
    resolvePackagePath
)

export const getExecutorProxyAdminContractAddress = createLZContractAddressGetter(
    'ExecutorProxyAdmin',
    resolvePackagePath
)

export const getOmniCounterContract = createLZContractGetter(OmniCounter__factory, 'OmniCounter', resolvePackagePath)

export const getOmniCounterContractAddress = createLZContractAddressGetter('OmniCounter', resolvePackagePath)

export const getSendLibBaseE1Contract = createLZContractGetter(
    SendLibBaseE1__factory,
    'SendLibBaseE1',
    resolvePackagePath
)

export const getAxelarDVNAdapterContract = createLZContractGetter(
    AxelarDVNAdapter__factory,
    'AxelarDVNAdapter',
    resolvePackagePath
)

export const getAxelarDVNAdapterFeeLibContract = createLZContractGetter(
    AxelarDVNAdapterFeeLib__factory,
    'AxelarDVNAdapterFeeLib',
    resolvePackagePath
)

// Used to get zksync contract definition
export const getDvnContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'DVN', chainName, environment)

export const getDvnReadContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'DVNRead', chainName, environment)

export const getDvnFeeLibContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'DVNFeeLib', chainName, environment)

export const getDvnFeeLibReadContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'DVNFeeLibRead', chainName, environment)

export const getExecutorImplementationContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'Executor_Implementation', chainName, environment)

export const getExecutorFeeLibContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'ExecutorFeeLib', chainName, environment)

export const getOmniCounterV2ContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'OmniCounter', chainName, environment)

export const getOmniReadCounterV2ContractArtifact = (chainName: string, environment: string) =>
    getEvmContractArtifact(PACKAGE_NAME, 'LzReadCounter', chainName, environment)

export {
    PacketSentEvent,
    PacketVerifiedEvent,
    PacketDeliveredEvent, // Works for ULN 301
    LzReceiveAlertEvent,
    PacketNilifiedEvent,
    PacketBurntEvent,
    InboundNonceSkippedEvent,
} from './typechain/EndpointV2'

// can be used for 301 and 302
export { PayloadVerifiedEvent, UlnConfigStructOutput, UlnConfigStruct } from './typechain/uln/uln302/ReceiveUln302'
export { DVNFeePaidEvent, ExecutorFeePaidEvent } from './typechain/uln/uln302/SendUln302'

export { VerifierFeePaidEventFilter as VerifierFeePaidUlnV2EventFilter } from './typechain/uln/dvn/DVN'

export { NativeDropAppliedEvent } from './typechain/Executor.sol/Executor'

export { ComposeDeliveredEvent, ComposeSentEvent, LzComposeAlertEvent } from './typechain/EndpointV2'
