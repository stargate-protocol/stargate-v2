import { ASSETS } from '@stargatefinance/stg-definitions-v2'
import {
    CreditMessagingEdgeConfig,
    CreditMessagingNodeConfig,
    TokenMessagingEdgeConfig,
    TokenMessagingNodeConfig,
} from '@stargatefinance/stg-devtools-v2'

import { makeZeroAddress } from '@layerzerolabs/devtools-evm'
import { OmniGraphHardhat } from '@layerzerolabs/devtools-evm-hardhat'

import { getContractWithEid } from '../../utils'
import { loadUnwireConfig, resolveUnwireChains } from '../../utils/unwire.config.utils'
import { setMainnetStage } from '../utils'

import { DEFAULT_PLANNER } from './constants'

type MessagingNode = TokenMessagingNodeConfig | CreditMessagingNodeConfig
type MessagingEdge = TokenMessagingEdgeConfig | CreditMessagingEdgeConfig

const buildMessagingAssetRemovalGraph = async (): Promise<OmniGraphHardhat<MessagingNode, MessagingEdge>> => {
    setMainnetStage()

    const contractName = process.env.MESSAGING_CONTRACT
    if (contractName !== 'TokenMessaging' && contractName !== 'CreditMessaging') {
        throw new Error(
            `MESSAGING_CONTRACT must be 'TokenMessaging' or 'CreditMessaging' (got ${contractName ?? 'undefined'})`
        )
    }

    const { tokenName, disconnectChains, remainingChains } = loadUnwireConfig(__dirname)
    const { validFromChains } = resolveUnwireChains(disconnectChains, remainingChains)

    const assetId = ASSETS[tokenName].assetId
    const zeroAddress = makeZeroAddress()

    const contracts = validFromChains.map((chain) => ({
        contract: getContractWithEid(chain.eid, { contractName }),
        config: {
            planner: DEFAULT_PLANNER,
            assets: {
                [zeroAddress]: assetId,
            },
        },
    }))

    const tt = {
        contracts,
        connections: [],
    }

    console.log(JSON.stringify(tt, null, 2))

    return tt
}

export default buildMessagingAssetRemovalGraph
