import { mainnetDeploymentAddresses } from '../configs/deployment/mainnet/deploymentConfig'
import { testnetDeploymentAddresses } from '../configs/deployment/testnet/deploymentConfig'
import { getContractDeploymentInfo } from '../stargate-contracts/contractUtils'

import type { Provider } from '@ethersproject/providers'
import type { Signer } from 'ethers'

const deploymentConfigs: {
    [environment: string]: {
        [chainName: string]: {
            [contractName: string]: string
        }
    }
} = {
    mainnet: mainnetDeploymentAddresses,
    testnet: testnetDeploymentAddresses,
    sandbox: testnetDeploymentAddresses,
    localnet: testnetDeploymentAddresses,
}

export const npmPackageToContractNameMapping: Record<string, string[]> = {
    '@layerzerolabs/lz-evm-sdk-v2': [
        'ReadLib1002',
        'ReadLib1002View',
        'DVN',
        'DVNFeeLib',
        'DVNFeeLibGCDA',
        'DVNGCDA',
        'DefaultProxyAdmin',
        'EndpointV2',
        'EndpointV2View',
        'Executor',
        'ExecutorFeeLib',
        'ExecutorProxyAdmin',
        'Executor_Proxy',
        'LzExecutor',
        'OmniCounter',
        'PriceFeed',
        'PriceFeedProxyAdmin',
        'ProxyAdmin',
        'ReceiveUln301',
        'ReceiveUln301View',
        'ReceiveUln302',
        'ReceiveUln302View',
        'SendLibBaseE1',
        'SendUln301',
        'SendUln302',
        'SimpleMessageLib',
        'Treasury',
        'AxelarDVNAdapter',
        'AxelarDVNAdapterFeeLib_Implementation',
        'AxelarDVNAdapterFeeLib_Proxy',
        'AxelarDVNAdapterFeeLib',
    ],
    '@layerzerolabs/lz-evm-sdk-v1': [
        'Endpoint',
        'NonceContract',
        'Relayer',
        'RelayerV2',
        'UltraLightNode',
        'UltraLightNodeV2',
        'TreasuryV2',
    ],
    '@layerzerolabs/multisig-oracle-contracts-evm': ['MultiSigOracle', 'MultiSigOracleGCDA', 'OracleFeeLibGCDA'],
    '@layerzerolabs/lz-ton-sdk-v2': [
        'AllStorages',
        'Controller',
        'Counter',
        'SimpleMsglib',
        'SmlManager',
        'SmlConnection',
        'Channel',
        'Endpoint',
        'UlnManager',
        'PriceFeedCache',
        'Executor',
        'ExecutorProxy',
        'Dvn',
        'DvnProxy',
        'Uln',
        'UlnConnection',
        'DvnFeeLib',
        'ExecutorFeeLib',
        'PriceFeedFeeLib',
        'Connection',
    ],
}

export const getLZContractAddress = (
    contractName: string,
    chainName: string,
    environment: string,
    resolvePackagePath: (address: string) => { address: string }
): string => {
    const addressFromConfig = deploymentConfigs[environment]?.[chainName]?.[contractName]

    if (addressFromConfig) {
        return addressFromConfig
    } else {
        // This is just a temporary check to make sure we do not miss any contract during migration
        const npmPackage = Object.keys(npmPackageToContractNameMapping).find((packageName) =>
            npmPackageToContractNameMapping[packageName].includes(contractName)
        )!

        const addressFromArtifact = getContractDeploymentInfo(
            npmPackage,
            contractName,
            chainName,
            environment,
            resolvePackagePath
        ).address

        console.log(
            `CONTRACT_ADDRESS_MISSING_IN_CONFIG id: ${chainName}-${environment}:${contractName} package: ${npmPackage} addressFromArtifact: ${addressFromArtifact} addressFromConfig: ${addressFromConfig}`
        )
        return addressFromArtifact
    }
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
