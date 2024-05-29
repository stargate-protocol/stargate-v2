import assert from 'assert'

import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Logger, createModuleLogger } from '@layerzerolabs/io-devtools'

import { getTokenDeployName } from '../../ops/util'
import { CONTRACT_MOCKERC20_TAGS } from '../constants'

import { createDeploy, getFeeData } from './deployments'
import { appendTags } from './helpers'
import { getAssetNetworkConfigMaybe, getTokenConfig } from './util'

const appendTokenTags = appendTags(CONTRACT_MOCKERC20_TAGS)

interface CreateDeployTokenOptions {
    tokenName: TokenName
}

export const createDeployToken = ({ tokenName }: CreateDeployTokenOptions): DeployFunction =>
    appendTokenTags(async (hre) => {
        // First let's get some basic info
        const network = hre.network.name
        const eid = getEidForNetworkName(network)
        const logger = createModuleLogger(`OFT ${tokenName} Deployer @ ${network}`)

        const tokenConfig = getAssetNetworkConfigMaybe(eid, tokenName)
        if (tokenConfig == null) {
            return logger.warn(`Skipping deployment: no config`), undefined
        }

        const stargateType = tokenConfig.type

        // We don't want to be deploying native currency, might be overambitious
        if (stargateType === StargateType.Native) {
            return logger.warn(`Skipping deployment for native token`), undefined
        }

        // Token config contains the name, symbol and possibly an address of the token
        const tokenProperties = getTokenConfig(eid, tokenName)

        // We also don't want to be deploying external tokens
        if (tokenProperties.address != null) {
            return logger.warn(`Skipping deployment for external token @ ${tokenProperties.address}`), undefined
        }

        const deploymentName = getTokenDeployName(tokenName, stargateType)

        return await deployToken(hre, logger, {
            ...tokenProperties,
            deploymentName,
            contractName: getContractName(stargateType, tokenName),
        })
    })

interface DeployTokenOptions {
    name: string
    symbol: string
    localDecimals: number
    deploymentName: string
    contractName: string
}

const deployToken = async (
    hre: HardhatRuntimeEnvironment,
    logger: Logger,
    { name, symbol, localDecimals, contractName, deploymentName }: DeployTokenOptions
) => {
    const deploy = createDeploy(hre)
    const feeData = await getFeeData(hre)
    const { deployer } = await hre.getNamedAccounts()

    logger.info(
        `Deploying OFT ${symbol} (name ${name}) (decimals ${localDecimals}) based on contract ${contractName} as ${deploymentName}`
    )

    await deploy(deploymentName, {
        contract: contractName,
        from: deployer,
        args: [name, symbol, localDecimals],
        log: true,
        waitConfirmations: 1,
        skipIfAlreadyDeployed: true,
        ...feeData,
    })
}

const getContractName = (stargateType: StargateType, tokenName: TokenName): string => {
    assert(tokenName !== TokenName.USDC, 'Should not deploy USDC with this method')
    assert(tokenName !== TokenName.USDT, 'Should not deploy USDT with this method')

    if (stargateType === StargateType.Pool) {
        return 'PoolToken' // NOTE: This is a mock, because the situation where we are deploying a Pool token because it does not have an address is expected in sandbox only
    }
    assert(stargateType === StargateType.Oft, 'Unknown Stargate Type: ' + stargateType)

    return 'OFTTokenERC20'
}
