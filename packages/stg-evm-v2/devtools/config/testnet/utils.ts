import { withEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

export const onEth = withEid(EndpointId.SEPOLIA_V2_TESTNET)
export const onBsc = withEid(EndpointId.BSC_V2_TESTNET)
export const onArb = withEid(EndpointId.ARBSEP_V2_TESTNET)
export const onOpt = withEid(EndpointId.OPTSEP_V2_TESTNET)
export const onKlaytn = withEid(EndpointId.KLAYTN_V2_TESTNET)
