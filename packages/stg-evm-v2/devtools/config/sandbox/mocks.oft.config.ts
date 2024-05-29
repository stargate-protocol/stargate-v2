import { createContractFactory, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'

import { onPolygon } from './utils'

import type { OwnableOmniGraphHardhat } from '@layerzerolabs/ua-devtools-evm-hardhat'

/**
 * Configure ownership of the mocked OFT contracts
 */
export default async (): Promise<OwnableOmniGraphHardhat> => {
    const getEnvironment = createGetHreByEid()
    const contractFactory = createContractFactory(getEnvironment)

    const polygonAssetETH = await contractFactory(onPolygon({ contractName: 'StargateOFTETH' }))

    return {
        contracts: [
            //
            // Polygon
            //
            {
                contract: onPolygon({ contractName: 'OFTTokenETH' }),
                config: {
                    owner: polygonAssetETH.contract.address,
                },
            },
        ],
        connections: [],
    }
}
