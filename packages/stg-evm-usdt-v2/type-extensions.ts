import 'hardhat/types/config'
import 'hardhat/types/runtime'

// Extend the Hardhat Runtime Environment
declare module 'hardhat/types/runtime' {
    export interface HardhatRuntimeEnvironment {
        // Add any custom properties you need here
        myCustomProperty: string
    }
}

// Extend Hardhat configuration
declare module 'hardhat/types/config' {
    export interface HardhatUserConfig {
        // Add custom config properties here if needed
    }
}
