import { promises as fs } from 'fs'
import * as path from 'path'

import type { StargatePoolConfigGetter, StargatePoolInfo, StargatePoolsConfig } from './types'

export class StargateConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'StargateConfigError'
    }
}

abstract class BaseConfig<T> {
    protected config!: T

    protected getConfig(): T {
        return this.config
    }
}

class BaseStargatePoolConfigGetter extends BaseConfig<StargatePoolsConfig> implements StargatePoolConfigGetter {
    protected constructor() {
        super()
    }

    public getPoolsConfig(): StargatePoolsConfig {
        return this.getConfig()
    }

    public getPoolInfo(assetId: string, chainName: string): StargatePoolInfo {
        const info = this.config[assetId]?.poolInfo[chainName]
        if (info == undefined) {
            throw new StargateConfigError(`pool info not found for assetId ${assetId} on chain ${chainName}`)
        }
        return info
    }

    public getAssetIds(): string[] {
        return Object.keys(this.config)
    }
}

export class LocalStargatePoolConfigGetter extends BaseStargatePoolConfigGetter {
    protected constructor(configs: StargatePoolsConfig) {
        super()
        this.config = configs
    }

    public static async create(filePath: string): Promise<StargatePoolConfigGetter> {
        const config = JSON.parse((await fs.readFile(filePath)).toString('utf-8')) as StargatePoolsConfig
        return new LocalStargatePoolConfigGetter(config)
    }
}

const getStargateDynamicConfigPath = (configName: string, environment: string): string => {
    const baseDir = path.join(__dirname, '..', 'generated-configs', configName)

    if (environment === 'mainnet') {
        return path.join(baseDir, 'mainnet', `${configName}.json`)
    } else if (environment === 'testnet') {
        return path.join(baseDir, 'testnet', `${configName}.json`)
    } else {
        throw new Error(`Unsupported environment: ${environment}`)
    }
}

export const getLocalStargatePoolConfigGetterFromArgs = async (
    environment: string
): Promise<StargatePoolConfigGetter> => {
    const configPath = getStargateDynamicConfigPath('stargatePoolConfig', environment)

    let fileContent: string
    try {
        fileContent = (await fs.readFile(configPath)).toString('utf-8').trim()
    } catch (error: any) {
        // If file doesn't exist, treat it as empty
        if (error.code === 'ENOENT') {
            fileContent = ''
        } else {
            throw error
        }
    }

    if (fileContent === '') {
        // Create a temporary file with empty config structure for empty/missing files
        const emptyConfig: StargatePoolsConfig = {}

        const tempConfigPath = configPath + '.tmp'
        await fs.writeFile(tempConfigPath, JSON.stringify(emptyConfig, null, 2))

        try {
            const result = await LocalStargatePoolConfigGetter.create(tempConfigPath)
            // Clean up temp file
            await fs.unlink(tempConfigPath)
            return result
        } catch (error) {
            // Clean up temp file on error
            try {
                await fs.unlink(tempConfigPath)
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
            throw error
        }
    }

    return await LocalStargatePoolConfigGetter.create(configPath)
}
