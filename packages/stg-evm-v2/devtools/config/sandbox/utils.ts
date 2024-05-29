import { withEid } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

export const onBsc = withEid(EndpointId.BSC_V2_SANDBOX)
export const onEth = withEid(EndpointId.ETHEREUM_V2_SANDBOX)
export const onPolygon = withEid(EndpointId.POLYGON_V2_SANDBOX)
