import { ASSETS, TokenName } from '@stargatefinance/stg-definitions-v2'

import { createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'

import { createGetAssetAddresses, createGetLPTokenAddresses } from '../../../ts-src/utils/util'

export const getAssetsConfig = async (
    getEnvironment = createGetHreByEid(),
    eid: EndpointId,
    tokenNames: TokenName[]
) => {
    const getAssetAddresses = createGetAssetAddresses(getEnvironment)
    const assetAddresses = await getAssetAddresses(eid, tokenNames)

    return Object.assign(
        {},
        ...tokenNames.map((tokenName) => {
            const assetAddress = assetAddresses[tokenName]
            return { [assetAddress]: ASSETS[tokenName].assetId }
        })
    )
}

export const getLPTokenAddress = async (
    getEnvironment = createGetHreByEid(),
    eid: EndpointId,
    tokenName: TokenName
) => {
    return (await createGetLPTokenAddresses(getEnvironment)(eid, [tokenName] as const))[tokenName]
}
