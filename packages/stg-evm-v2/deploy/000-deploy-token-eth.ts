import { TokenName } from '@stargatefinance/stg-definitions-v2'

import { createDeployToken } from '../ts-src/utils/deploy-token'

export default createDeployToken({ tokenName: TokenName.ETH })
