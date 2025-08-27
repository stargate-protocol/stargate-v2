import assert from 'assert'

import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'

export function getTokenDeployName(tokenName: TokenName, stargateType: StargateType) {
    assert(tokenName !== TokenName.USDC, 'Should not use getTokenDeployName for USDC')
    assert(tokenName !== TokenName.USDT, 'Should not use getTokenDeployName for USDT')
    assert(tokenName !== TokenName.EURC, 'Should not use getTokenDeployName for EURC')

    return `${stargateType}Token${tokenName}`
}

export const getPoolAssetDeploymentName = (tokenName: string) => `StargatePool${tokenName}`

export const getOFTAssetDeploymentName = (tokenName: string) => `StargateOFT${tokenName}`

export const getNativePoolAssetDeploymentName = () => `StargatePoolNative`

export function getStargateDeployName(tokenName: string, stargateType: StargateType) {
    return stargateType === StargateType.Native
        ? 'StargatePoolNative'
        : stargateType === StargateType.Pool
          ? `StargatePool${tokenName}`
          : `StargateOFT${tokenName}`
}

export function getIntentDeployName(tokenName: string, stargateType: StargateType) {
    return stargateType === StargateType.Native
        ? 'IntentPoolNative'
        : stargateType === StargateType.Pool
          ? `IntentPool${tokenName}`
          : `IntentOFT${tokenName}`
}

export function getMessagingDeployName(tokenName: string) {
    return `Messaging${tokenName}`
}

export function getFeeLibV1DeployName(tokenName: string) {
    return `FeeLibV1${tokenName}`
}

export function getCircleFiatTokenImplDeployName(tokenName: TokenName) {
    return `${tokenName}Impl`
}

export function getCircleFiatTokenProxyDeployName(tokenName: TokenName) {
    return `${tokenName}Proxy`
}

export function getCircleFiatTokenSignatureLibDeployName(tokenName: TokenName) {
    return `${tokenName}SignatureLib`
}

export function getUSDTDeployName() {
    return `USDT`
}
