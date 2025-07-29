import { promises as fs } from 'fs'
import * as fsSync from 'fs'
import * as path from 'path'

import { JsonRpcProvider } from '@ethersproject/providers'
import { LoggerOptions, format, transports } from 'winston'

import type { Provider } from '@ethersproject/providers'

try {
    const { configDotenv } = require('dotenv')
    configDotenv({
        path: ['.env.local', '.env'],
    })
} catch (error) {
    console.warn('dotenv not available, ensure environment variables are set manually')
}

export interface IToken {
    address: string
    decimals: number
    symbol: string
}

export enum StargateTypes {
    POOL = 'POOL',
    OFT = 'OFT',
    NATIVE = 'NATIVE',
}

export enum FarmType {
    LPStaking = 'lpStaking',
    LPStakingTime = 'lpStakingTime',
    StargateStaking = 'stargateStaking',
}

export interface V1FarmDefinition {
    address: string
    pid: number
    rewardToken: IToken
}

export interface FarmDefinition {
    [FarmType.LPStaking]: V1FarmDefinition
    [FarmType.LPStakingTime]: V1FarmDefinition
    [FarmType.StargateStaking]: {
        address: string
        rewardTokens: IToken[]
    }
}

interface CommonStargatePoolInfo {
    stargateType: StargateTypes
    address: string
    token: IToken
}

export type Farms = {
    [Type in FarmType]?: FarmDefinition[Type]
}

export interface StargatePoolInfo extends CommonStargatePoolInfo {
    lpToken?: IToken
    farm?: Farms
}

export type StargatePoolInfoList = {
    [chainName: string]: StargatePoolInfo
}

export type StargatePoolConfig = {
    sharedDecimals: number
    poolInfo: StargatePoolInfoList
}

export type StargatePoolsConfig = {
    [assetId: string]: StargatePoolConfig
}

export interface StargatePoolConfigGetter {
    getPoolsConfig(): StargatePoolsConfig
    getPoolInfo(assetId: string, chainName: string): StargatePoolInfo
    getAssetIds(): string[]
}

class StargateConfigError extends Error {
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
    const baseDir = path.join(__dirname, 'configs', configName)

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

enum UlnVersion {
    V1 = 'V1',
    V2 = 'V2',
    V300 = 'V300', // simpleMessageLib
    V301 = 'V301',
    V302 = 'V302',
    ReadV1002 = 'ReadV1002',
}

interface UriWithHeaders {
    uri: string
    headers?: { [header: string]: string }
}

interface ProviderConfig {
    uris: string[] | UriWithHeaders[]
    quorum?: number
}

interface ProviderConfigs {
    [chainName: string]: ProviderConfig
}

interface BootstrapChainConfig {
    chainNames: string[]
    environment: string
    providers: {
        [chainName: string]: Provider
    }
    initialTokensOverrides?: {
        [chainName: string]: string | { [key: string]: string }
    }
}

export interface BootstrapChainConfigWithUln extends BootstrapChainConfig {
    supportedUlnVersions: UlnVersion[]
}

const createProviderFromConfig = (config: ProviderConfig, chainName: string): Provider => {
    if (config.uris.length === 0) {
        throw new Error(`No RPC URLs available for chain: ${chainName}`)
    }

    const uri = typeof config.uris[0] === 'string' ? config.uris[0] : config.uris[0].uri
    return new JsonRpcProvider(uri)
}

const getRpcUrl = (chainRawName: string, environment: string): string | null => {
    if (!chainRawName || !environment) return null

    let templateUrl

    switch (environment) {
        case 'testnet':
            templateUrl = process.env.RPC_URL_TESTNET
            break
        case 'mainnet':
            templateUrl = process.env.RPC_URL_MAINNET
            break
        default:
            return null
    }

    const url = templateUrl?.replace('CHAIN', chainRawName) ?? null
    return url
}

const getAvailableChainNamesFromDeployments = (environment: string, sorted = false): string[] => {
    try {
        const deploymentsPath = path.join(__dirname, '..', 'deployments')

        if (!fsSync.existsSync(deploymentsPath)) {
            console.warn(`Deployments directory not found: ${deploymentsPath}`)
            return []
        }

        const deploymentDirs = fsSync
            .readdirSync(deploymentsPath, { withFileTypes: true })
            .filter((dirent: fsSync.Dirent) => dirent.isDirectory())
            .map((dirent: fsSync.Dirent) => dirent.name)

        let filteredDirs: string[]

        if (environment === 'mainnet') {
            filteredDirs = deploymentDirs.filter((dir: string) => dir.endsWith('-mainnet'))
        } else if (environment === 'testnet') {
            filteredDirs = deploymentDirs.filter((dir: string) => dir.endsWith('-testnet'))
        } else {
            console.warn(`Unsupported environment: ${environment}. Returning all deployment directories.`)
            filteredDirs = deploymentDirs
        }

        // Extract raw chain names by removing the environment suffix
        const chainNames = filteredDirs
            .map((dir: string) => {
                if (dir.endsWith('-mainnet')) {
                    return dir.replace(/-mainnet$/, '')
                } else if (dir.endsWith('-testnet')) {
                    return dir.replace(/-testnet$/, '')
                } else {
                    return dir
                }
            })
            .filter((name: string) => name.length > 0)

        // Return unique chain names, sorted if requested
        const uniqueChainNames = Array.from(new Set(chainNames))
        return sorted ? uniqueChainNames.sort() : uniqueChainNames
    } catch (error) {
        console.warn(`Failed to read deployment directories for environment ${environment}: ${error}`)
        return []
    }
}

const getAvailableChainNames = (providerConfigs: ProviderConfigs): string[] => {
    return Object.keys(providerConfigs)
}

const getAvailableChainsFromArgs = (
    args: {
        only: string | undefined
        environment: string
    },
    availableChainNames: string[]
): {
    chainNames: string[]
    initialTokensOverrides: {
        [chainName: string]: string | { [key: string]: string }
    }
} => {
    if (args.only) {
        const chainNames: string[] = []
        const initialTokensOverrides = args.only.split(',').reduce(
            (
                acc: {
                    [chainName: string]: string | { [key: string]: string }
                },
                o: string
            ) => {
                const override = o.split(':')[1]
                const chainName = availableChainNames.find((cn: string) => cn.startsWith(o.split(':')[0]))
                if (chainName) {
                    chainNames.push(chainName)
                    if (o.split(':')[1]) {
                        const currentToken = override && o.split(':')[1]
                        acc[chainName] = currentToken
                    }
                }

                return acc
            },
            {}
        )

        return { chainNames, initialTokensOverrides }
    }

    return { chainNames: availableChainNames, initialTokensOverrides: {} }
}

export const getAvailableChainNamesByEnvironment = (environment: string): string[] => {
    return getAvailableChainNamesFromDeployments(environment, true)
}

const loadProviderConfigs = async (environment: string, chainNames?: string[]): Promise<ProviderConfigs> => {
    try {
        const availableChainNames = chainNames || getAvailableChainNamesFromDeployments(environment)

        if (availableChainNames.length === 0) {
            throw new Error('No chain names available from deployment directories')
        }

        const providerConfigs: ProviderConfigs = {}

        for (const chainName of availableChainNames) {
            const rpcUrl = getRpcUrl(chainName, environment)
            if (rpcUrl) {
                providerConfigs[chainName] = {
                    uris: [rpcUrl],
                    quorum: 1,
                }
            } else {
                providerConfigs[chainName] = {
                    uris: [],
                    quorum: 1,
                }
                console.warn(`No RPC URL found for chain: ${chainName}`)
            }
        }

        return providerConfigs
    } catch (error) {
        throw new Error(`Failed to generate provider configs for environment ${environment}: ${error}`)
    }
}

const getBootstrapChainConfigFromArgs = async (
    service: string,
    args: {
        only: string | undefined
        environment: string
        noFork: boolean
        servicePath?: string
    },
    isSupportedChainName?: (chainName: string, environment: string) => boolean
): Promise<BootstrapChainConfig> => {
    const providerConfigs = await loadProviderConfigs(args.environment)
    const availableChainNames = getAvailableChainNames(providerConfigs)

    const { chainNames: filteredChainNames, initialTokensOverrides } = getAvailableChainsFromArgs(
        args,
        availableChainNames
    )

    const chainNames = isSupportedChainName
        ? filteredChainNames.filter((chainName) => {
              const [chainRawName] = chainName.split('-', 2)
              return isSupportedChainName(chainRawName, args.environment)
          })
        : filteredChainNames

    if (!chainNames.length) {
        throw new Error('No chainNames after applying filters')
    }

    const providers: { [chainName: string]: Provider } = {}
    const validChainNames: string[] = []

    for (const chainName of chainNames) {
        try {
            providers[chainName] = createProviderFromConfig(providerConfigs[chainName], chainName)
            validChainNames.push(chainName)
        } catch (error) {
            console.warn(`Skipping chain ${chainName}: ${error instanceof Error ? error.message : error}`)
        }
    }

    if (!validChainNames.length) {
        throw new Error('No chains with valid RPC URLs found after applying filters')
    }

    return {
        providers,
        environment: args.environment,
        chainNames: validChainNames,
        initialTokensOverrides,
    }
}

export const getBootstrapChainConfigWithUlnFromArgs = async (
    service: string,
    args: {
        only: string | undefined
        environment: string
        noFork: boolean
    },
    isSupportedChainName?: (chainName: string, environment: string) => boolean
): Promise<BootstrapChainConfigWithUln> => {
    return {
        ...(await getBootstrapChainConfigFromArgs(service, args, isSupportedChainName)),
        supportedUlnVersions: [UlnVersion.V2],
    }
}

export const bootstrapLoggerConfigFromArgs: LoggerOptions = {
    level: 'debug',
    format: format.combine(format.prettyPrint(), format.colorize({ all: true })),
    transports: [new transports.Console()],
}
