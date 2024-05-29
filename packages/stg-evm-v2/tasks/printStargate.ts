import { StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import {
    Chain,
    EndpointVersion,
    Stage,
    chainAndStageToEndpointId,
    networkToChain,
    networkToStage,
} from '@layerzerolabs/lz-definitions'

import { getStargateDeployName } from '../ops/util'
import { ERC20Token, FeeLibV1, StargateBase, StargatePool } from '../ts-src'
import { types } from '../ts-src/utils/cli'
import { getAssetType } from '../ts-src/utils/util'

import type { ActionType } from 'hardhat/types'

interface TaskArgs {
    token: TokenName
}

const action: ActionType<TaskArgs> = async ({ token }, hre) => {
    const network = hre.network.name
    const eid = getEidForNetworkName(hre.network.name)
    const type = getAssetType(eid, token)

    const provider = hre.ethers.provider
    const stage = networkToStage(network)
    const stargateDeployment = await hre.deployments.get(getStargateDeployName(token, type))
    console.log(`Stargate ${type.toUpperCase()}(${network.toUpperCase()}) Info:`)
    const stargateAddress = stargateDeployment.address
    console.log(`======================= Address =======================`)
    console.log(`stargate: ${stargateAddress}`)
    const stargate = (await hre.ethers.getContractAt(stargateDeployment.abi, stargateAddress)) as StargateBase
    const addressConfig = await stargate.getAddressConfig()
    console.log(`feelibrary: ${addressConfig.feeLib}`)
    console.log(`planner: ${addressConfig.planner}`)
    console.log(`treasurer: ${addressConfig.treasurer}`)
    console.log(`tokenMessaging: ${addressConfig.tokenMessaging}`)
    console.log(`creditMessaging: ${addressConfig.creditMessaging}`)
    console.log(`lzToken: ${addressConfig.lzToken}`)
    const tokenAddress = await stargate.token()
    const isNative = tokenAddress === ethers.constants.AddressZero
    console.log(`token: ${isNative ? 'native' : stargateAddress}`)
    const tokenSharedDecimals = await stargate.sharedDecimals()
    let tokenContract: ERC20Token = undefined!
    let tokenDecimals = 18
    if (isNative) {
        /* empty */
    } else {
        tokenContract = (await hre.ethers.getContractAt('ERC20Token', tokenAddress)) as ERC20Token
        tokenDecimals = await tokenContract.decimals()
    }
    console.log(`======================= Credits =======================`)
    const chains =
        stage === Stage.SANDBOX
            ? [Chain.ETHEREUM, Chain.POLYGON, Chain.BSC]
            : [Chain.ETHEREUM, Chain.POLYGON, Chain.BSC, Chain.AVALANCHE, Chain.SEPOLIA, Chain.ARBSEP]
    for (const chain of chains) {
        const eid = chainAndStageToEndpointId(chain, stage, EndpointVersion.V2)
        const credit = await stargate.paths(eid)
        if (chain === networkToChain(network)) {
            console.log(
                `Local ${chain.toUpperCase()}[${eid}] credits: ${ethers.utils.formatUnits(credit, tokenSharedDecimals)}`
            )
        } else {
            console.log(
                `=> ${chain.toUpperCase()}[${eid}] credits: ${ethers.utils.formatUnits(credit, tokenSharedDecimals)}`
            )
        }
    }
    console.log(`======================= Balance =======================`)
    if (type !== StargateType.Oft) {
        const lpTokenAddress = await (stargate as StargatePool).lpToken()
        const lpToken = (await hre.ethers.getContractAt('LPToken', lpTokenAddress)) as ERC20Token
        console.log(`total lp: ${ethers.utils.formatUnits(await lpToken.totalSupply(), await lpToken.decimals())}`)
        isNative
            ? console.log(`balance:${ethers.utils.formatEther(await provider.getBalance(stargate.address))}`)
            : console.log(
                  `balance: ${ethers.utils.formatUnits(await tokenContract.balanceOf(stargateAddress), tokenDecimals)}`
              )
    }
    console.log(`treasuryFee: ${ethers.utils.formatUnits(await stargate.treasuryFee(), tokenSharedDecimals)}`)

    console.log(`======================= FeeLib =======================`)
    const feeLib = (await hre.ethers.getContractAt('FeeLibV1', addressConfig.feeLib)) as FeeLibV1
    const dstEids = chains.map((chain) => chainAndStageToEndpointId(chain, stage, EndpointVersion.V2))
    await Promise.all(
        dstEids.map((dstEid) =>
            feeLib.feeConfigs(dstEid).then((fee) => {
                const { zone1UpperBound, zone2UpperBound, zone1FeeMillionth, zone2FeeMillionth, zone3FeeMillionth } =
                    fee
                console.log(
                    `fee[${dstEid}]: zone1UpperBound ${zone1UpperBound.toString()} zone2UpperBound ${zone2UpperBound.toString()} zone1FeeMillionth ${zone1FeeMillionth.toString()} zone2FeeMillionth ${zone2FeeMillionth.toString()} zone3FeeMillionth ${zone3FeeMillionth.toString()}`
                )
            })
        )
    )
}

task('printStargate', 'print stargate info', action)
    .addParam('type', 'stargate type', 'Pool')
    .addParam('token', 'token name', undefined, types.token)
