import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { AssetEdgeConfig, AssetNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { type OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { createGetAssetNode, createGetAssetOmniPoint, getDefaultAddressConfig } from '../../../utils'
import { filterConnections, generateAssetConfig } from '../../utils'
import { filterFromAndToChains, getChainsThatSupportToken, printChains } from '../../utils.config'
import { setMainnetStage } from '../utils'

import { DEFAULT_PLANNER } from './constants'

export default async function buildAssetDeploymentGraph(
    tokenName: TokenName
): Promise<OmniGraphHardhat<AssetNodeConfig, AssetEdgeConfig>> {
    // Set the stage to mainnet
    setMainnetStage()

    const getAssetPoint = createGetAssetOmniPoint(tokenName)
    const getAddressConfig = getDefaultAddressConfig(tokenName, { planner: DEFAULT_PLANNER })

    const fromChains = process.env.FROM_CHAINS ? process.env.FROM_CHAINS.split(',') : []
    const toChains = process.env.TO_CHAINS ? process.env.TO_CHAINS.split(',') : []

    const getAssetNode = createGetAssetNode(tokenName, undefined, undefined, getAddressConfig)

    // Check if provided chains are valid
    const supportedChains = getChainsThatSupportToken(tokenName)

    // Get valid chains config for the chains in the fromChains and toChains
    const { validFromChains, validToChains } = filterFromAndToChains(fromChains, toChains, supportedChains)

    printChains(`asset.${tokenName} FROM_CHAINS:`, validFromChains)
    printChains(`asset.${tokenName} TO_CHAINS:`, validToChains)

    // Now we define all the contracts (from the valid chains set)
    const fromPoints = Array.from(validFromChains).map((chain) => getAssetPoint(chain.eid))
    const toPoints = Array.from(validToChains).map((chain) => getAssetPoint(chain.eid))

    // Get all points based on eid, with no duplicates
    const pointsMap = new Map()
    fromPoints.forEach((point) => pointsMap.set(point.eid, point))
    toPoints.forEach((point) => pointsMap.set(point.eid, point))
    const allPoints = Array.from(pointsMap.values())

    // And all their nodes (from the valid chains set)
    const fromContracts = await Promise.all(fromPoints.map(async (point) => await getAssetNode(point)))
    const toContracts = await Promise.all(toPoints.map(async (point) => await getAssetNode(point)))

    const contractMap = new Map()
    fromContracts.forEach((contract) => contractMap.set(contract.contract.eid, contract))
    toContracts.forEach((contract) => contractMap.set(contract.contract.eid, contract))

    const allConnections = generateAssetConfig(tokenName, allPoints)
    const connections = filterConnections(
        allConnections,
        fromContracts.map((c) => c.contract),
        toContracts.map((c) => c.contract)
    )

    return {
        contracts: Array.from(contractMap.values()),
        connections,
    }
}
