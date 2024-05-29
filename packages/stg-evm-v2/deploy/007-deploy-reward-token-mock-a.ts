import 'hardhat-deploy'

import '@nomiclabs/hardhat-ethers'

import { RewardTokenName } from '@stargatefinance/stg-definitions-v2'

import { createDeployRewardToken } from '../ts-src/utils/deploy-reward-token'

export default createDeployRewardToken({ tokenName: RewardTokenName.MOCK_A })
