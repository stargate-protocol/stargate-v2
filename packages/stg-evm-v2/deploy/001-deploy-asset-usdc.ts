import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { getCircleFiatTokenProxyDeployName } from '../ops/util'
import { createDeployAsset } from '../ts-src/utils/deploy-asset'

const tokenName = TokenName.USDC
export default createDeployAsset({
    tokenName: tokenName,
    tokenDeploymentName: getCircleFiatTokenProxyDeployName(tokenName),
})
