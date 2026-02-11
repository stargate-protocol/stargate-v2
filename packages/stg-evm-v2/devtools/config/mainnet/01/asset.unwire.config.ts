import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { createGetAssetOmniPoint } from '../../../utils'
import { loadUnwireConfig, resolveUnwireChains } from '../../utils/unwire.config.utils'
import { setMainnetStage } from '../utils'

const buildAssetUnwireGraph = async (): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> => {
    setMainnetStage()

    const unwireConfig = loadUnwireConfig(__dirname)
    if (!unwireConfig) {
        return { contracts: [], connections: [] }
    }

    const { tokenName, disconnectChains, remainingChains } = unwireConfig
    const { validFromChains, validToChains } = resolveUnwireChains(tokenName, disconnectChains, remainingChains)

    const getAssetPoint = createGetAssetOmniPoint(tokenName)
    const disconnectPoints = validFromChains.map((chain) => ensureContractName(getAssetPoint(chain.eid)))
    const remainingPoints = validToChains.map((chain) => ensureContractName(getAssetPoint(chain.eid)))

    const allPointsMap = new Map<number, { eid: number; contractName: string }>()
    disconnectPoints.forEach((point) => allPointsMap.set(point.eid, point))
    remainingPoints.forEach((point) => allPointsMap.set(point.eid, point))
    const allPoints = Array.from(allPointsMap.values())

    const contracts = allPoints.map((point) => ({
        contract: point,
        config: {},
    }))

    const connections = [
        // disconnect the remaining points from the disconnect points
        ...disconnectPoints.flatMap((from) =>
            remainingPoints
                .filter((to) => to.eid !== from.eid)
                .map((to) => ({
                    from,
                    to,
                    config: { isOFT: false },
                }))
        ),
        ...remainingPoints.flatMap((from) =>
            disconnectPoints
                .filter((to) => to.eid !== from.eid)
                .map((to) => ({
                    from,
                    to,
                    config: { isOFT: false },
                }))
        ),
        // disconnect the disconnect points between themselves
        ...disconnectPoints.flatMap((from) =>
            disconnectPoints
                .filter((to) => to.eid !== from.eid)
                .map((to) => ({
                    from,
                    to,
                    config: { isOFT: false },
                }))
        ),
    ]

    return { contracts, connections }
}

export default buildAssetUnwireGraph

const ensureContractName = (point: { eid: number; contractName?: string | null }) => {
    if (!point.contractName) {
        throw new Error(`Missing contractName for eid ${point.eid}`)
    }
    return { eid: point.eid, contractName: point.contractName }
}
