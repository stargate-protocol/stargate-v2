import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { getUSDTDeployName } from '../ops/util'
import { createDeployAsset } from '../ts-src/utils/deploy-asset'

export default createDeployAsset({ tokenName: TokenName.USDT, tokenDeploymentName: getUSDTDeployName() })
