import { hexZeroPad } from 'ethers/lib/utils'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Bytes20, PossiblyBytes } from '@layerzerolabs/devtools'

import { setMainnetStage } from '../../devtools/config/mainnet/utils'

export const makeBytes20 = (address?: PossiblyBytes | null | undefined): Bytes20 => hexZeroPad(address || '0x0', 20)

export function setupConfigTestEnvironment(hre: HardhatRuntimeEnvironment) {
    let originalEnv: NodeJS.ProcessEnv
    let originalPaths: any

    before(() => {
        // In the config creation the hre paths are being modified.
        // Save original paths
        originalPaths = { ...hre.config.paths }

        // Save original environment variables
        originalEnv = { ...process.env }

        // set mainnet stage
        setMainnetStage()
    })

    beforeEach(() => {
        // clean env to avoid generating config with wrong env variables
        process.env = {}
    })

    after(() => {
        // restore original paths
        hre.config.paths = originalPaths

        // restore original environment variables
        process.env = originalEnv
    })
}
