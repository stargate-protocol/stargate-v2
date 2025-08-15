import { TokenName } from '@stargatefinance/stg-definitions-v2'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { createDeployCircleFiatToken } from './deploy-circle-fiat-token'

const tokenName = TokenName.EURC
export const createDeployEURC = (): DeployFunction => createDeployCircleFiatToken(tokenName)
