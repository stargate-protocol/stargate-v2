import assert from 'assert'
import { promises as fs } from 'fs'
import path from 'path'

import { createLogger } from 'winston'

import {
    FarmType,
    StargatePoolConfig,
    StargatePoolsConfig,
    bootstrapLoggerConfigFromArgs,
    getAvailableChainNamesByEnvironment,
    getBootstrapChainConfigWithUlnFromArgs,
    getLocalStargatePoolConfigGetterFromArgs,
} from './bootstrap-config'
import { retryWithBackoff } from './common-utils/retry'
import { filterStargateV2SupportedChainNames, isStargateV2SupportedChainName } from './stargate-contracts'
import { StargateV2SdkFactory } from './stargate-sdks/factory'

const sortPoolInfo = (poolsConfig: StargatePoolsConfig) => {
    for (const configs of Object.values(poolsConfig)) {
        const sortedObj = Object.fromEntries(Object.entries(configs.poolInfo).sort((a, b) => a[0].localeCompare(b[0])))
        configs.poolInfo = sortedObj
    }
}

const generatePoolConfig = async (params: { environment: string; verbose?: boolean; numRetries?: number }) => {
    const { environment, verbose = false, numRetries = 3 } = params

    // Create logger with appropriate level based on verbose flag
    const loggerConfig = {
        ...bootstrapLoggerConfigFromArgs,
        level: verbose ? 'debug' : 'info',
    }
    const logger = createLogger(loggerConfig)

    logger.info(`🚀 Starting pool config generation for environment: ${environment}`)

    const filepath = path.join(
        path.dirname(require.resolve('../package.json')),
        'src',
        'configs',
        'stargatePoolConfig',
        environment,
        'stargatePoolConfig.json'
    )

    logger.debug(`📁 Config file path: ${filepath}`)
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    logger.debug(`📁 Created directory structure`)

    const stargatePoolsConfig: StargatePoolsConfig = {}

    const chainNames = filterStargateV2SupportedChainNames(
        getAvailableChainNamesByEnvironment(environment),
        environment
    )

    logger.info(`🔍 Found ${chainNames.length} supported chain names: ${chainNames.join(', ')}`)

    const bootstrapChainConfigArgs = { only: chainNames.join(','), environment }

    if (chainNames.length) {
        logger.info(`⚙️  Bootstrapping chain configuration...`)
        const bootstrapChainConfig = await getBootstrapChainConfigWithUlnFromArgs(
            'stargate',
            { ...bootstrapChainConfigArgs, noFork: true },
            isStargateV2SupportedChainName
        )
        logger.debug(`✅ Bootstrap completed for ${bootstrapChainConfig.chainNames.length} chains`)

        logger.info(`🏭 Creating Stargate V2 SDK Factory...`)
        const stargateV2SdkFactory = new StargateV2SdkFactory({
            ...bootstrapChainConfig,
            stargatePoolConfigGetter: await getLocalStargatePoolConfigGetterFromArgs(environment),
            logger,
        })
        logger.debug(`✅ SDK Factory created successfully`)

        for (const chainName of bootstrapChainConfig.chainNames) {
            logger.info(`🔗 Processing chain: ${chainName}`)

            try {
                const sdk = stargateV2SdkFactory.getSdk(chainName)
                logger.debug(`📦 SDK instance created for ${chainName}`)

                logger.debug(`🚜 Fetching farm metadata for ${chainName}...`)
                const farmMetadata = await retryWithBackoff(
                    () => sdk.farmMetadata(),
                    numRetries,
                    chainName,
                    'farmMetadata',
                    logger
                )
                logger.debug(`✅ Farm metadata fetched: ${farmMetadata.length} farms found`)

                logger.debug(`🏊 Fetching pools for ${chainName}...`)
                const { stargateImpls } = await retryWithBackoff(
                    () => sdk.fetchPools(),
                    numRetries,
                    chainName,
                    'fetchPools',
                    logger
                )
                const poolCount = Object.keys(stargateImpls).length
                logger.info(`📊 Found ${poolCount} pools on ${chainName}: ${Object.keys(stargateImpls).join(', ')}`)

                for (const [assetId, address] of Object.entries(stargateImpls)) {
                    logger.debug(`🔍 Processing asset ${assetId} at address ${address} on ${chainName}`)

                    if (!stargatePoolsConfig[assetId]) {
                        stargatePoolsConfig[assetId] = {} as StargatePoolConfig
                        logger.debug(`📝 Created new config entry for asset ${assetId}`)
                    }

                    logger.debug(`📋 Fetching contract metadata for ${address}...`)
                    const { token, stargateType, sharedDecimals, lpToken } = await retryWithBackoff(
                        () => sdk.contractMetadata(address),
                        numRetries,
                        chainName,
                        `contractMetadata(${assetId})`,
                        logger
                    )
                    logger.debug(
                        `✅ Contract metadata: token=${token.symbol}, type=${stargateType}, decimals=${sharedDecimals}`
                    )

                    if (stargatePoolsConfig[assetId]['sharedDecimals'] != undefined) {
                        assert(
                            sharedDecimals === stargatePoolsConfig[assetId]!['sharedDecimals'],
                            `sharedDecimals mismatch expected ${stargatePoolsConfig[assetId]['sharedDecimals']} but got ${sharedDecimals}`
                        )
                        logger.debug(`✅ SharedDecimals validation passed for ${assetId}`)
                    }

                    stargatePoolsConfig[assetId]['sharedDecimals'] = sharedDecimals

                    if (!stargatePoolsConfig[assetId].poolInfo) {
                        stargatePoolsConfig[assetId].poolInfo = {}
                    }

                    stargatePoolsConfig[assetId].poolInfo[chainName] = {
                        stargateType,
                        address,
                        token,
                        lpToken,
                    }

                    const farm = farmMetadata.find(({ lpToken: lp }) => lp === lpToken?.address)

                    if (!farm) {
                        logger.debug(`⚠️  No farm found for lpToken ${lpToken?.address} on ${chainName}`)
                        continue
                    }

                    logger.debug(`🚜 Adding farm config for ${assetId} on ${chainName}: ${farm.address}`)
                    stargatePoolsConfig[assetId].poolInfo[chainName].farm = {
                        [FarmType.StargateStaking]: {
                            address: farm.address,
                            rewardTokens: farm.rewardTokens,
                        },
                    }
                }

                logger.info(`✅ Completed processing ${chainName}`)
            } catch (error) {
                logger.error(`❌ Error processing chain ${chainName}:`, error)
                throw error
            }
        }
    } else {
        logger.warn(`⚠️  No chain names found for environment ${environment}`)
    }

    logger.info(`🔄 Sorting pool info...`)
    sortPoolInfo(stargatePoolsConfig)

    const stargatePoolsConfigString = JSON.stringify(stargatePoolsConfig, null, 4)

    logger.info(`💾 Writing config to file: ${filepath}`)
    logger.debug(`📄 Config content preview:\n${stargatePoolsConfigString.substring(0, 500)}...`)

    await fs.writeFile(filepath, stargatePoolsConfigString)
    logger.info(`✅ Successfully wrote pool config file`)
}

export const generatePoolConfigs = async (params: { environments: string; verbose?: boolean; numRetries?: number }) => {
    const { environments: environmentString, verbose = false, numRetries = 3 } = params

    const environments = environmentString.split(',')
    const logger = createLogger({
        ...bootstrapLoggerConfigFromArgs,
        level: verbose ? 'debug' : 'info',
    })

    logger.info(
        `🎯 Starting pool config generation for ${environments.length} environment(s): ${environments.join(', ')}`
    )
    logger.info(`🔄 Using ${numRetries} retries for RPC calls`)

    await Promise.all(environments.map((environment) => generatePoolConfig({ environment, verbose, numRetries })))

    logger.info(`🎉 Completed pool config generation for all environments`)
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('./checkDeployment/utils')

        const args = parse({
            header: 'Update Pool Config for StargateV2',
            description: 'Fetches onchain connections for stargate V2 and updates the file',
            args: {
                environments: {
                    alias: 'e',
                    type: String,
                    defaultValue: 'mainnet',
                    description: 'Comma-separated list of environments (mainnet, testnet)',
                },
                verbose: {
                    alias: 'v',
                    type: Boolean,
                    defaultValue: false,
                    description: 'Enable verbose debug logging',
                },
                numRetries: {
                    alias: 'r',
                    type: Number,
                    defaultValue: 3,
                    description: 'Number of retries for RPC calls before giving up',
                },
            },
        })

        await generatePoolConfigs(args)
    }

    main()
        .then(() => {
            const logger = createLogger(bootstrapLoggerConfigFromArgs)
            logger.info('🎉 Pool Configs updated successfully!')
            process.exit(0)
        })
        .catch((error) => {
            const logger = createLogger(bootstrapLoggerConfigFromArgs)
            logger.error('❌ Error updating Pool Configs:', error)
            process.exit(1)
        })
}
