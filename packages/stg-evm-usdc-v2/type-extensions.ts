import 'hardhat/types/config'

declare module 'hardhat/types/config' {
    interface HardhatNetworkUserConfig {
        useFeeData?: never
    }

    interface HardhatNetworkConfig {
        useFeeData?: never
    }

    interface HttpNetworkUserConfig {
        /**
         * When set to true, it will cause the `getFeeData`
         * utility to grab fee data from the chain using `provider.getFeeData()` function.
         *
         * It is not universally enabled since it was causing issues on polygon network,
         * plus it is only important for arbitrum chains (mainnet & testnet)
         */
        useFeeData?: boolean
    }

    interface HttpNetworkConfig {
        /**
         * When set to true, it will cause the `getFeeData`
         * utility to grab fee data from the chain using `provider.getFeeData()` function.
         *
         * It is not universally enabled since it was causing issues on polygon network,
         * plus it is only important for arbitrum chains (mainnet & testnet)
         */
        useFeeData?: boolean
    }
}
