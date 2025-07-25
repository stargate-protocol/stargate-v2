import { promises as fs } from 'fs'
import * as fsSync from 'fs'
import * as path from 'path'

import { JsonRpcProvider } from '@ethersproject/providers'
import { LoggerOptions, format, transports } from 'winston'

import { StargateVersion } from './checkDeployment/utils'

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

export interface StargatePoolInfo {
    [StargateVersion.V1]: CommonStargatePoolInfo & {
        lpToken: IToken
        farm?: Farms
    }
    [StargateVersion.V2]: CommonStargatePoolInfo & {
        lpToken?: IToken
        farm?: Farms
    }
}

export type StargatePoolInfoList<Version extends StargateVersion> = {
    [chainName: string]: StargatePoolInfo[Version]
}

export type StargatePoolConfig<Version extends StargateVersion> = {
    sharedDecimals: number
    poolInfo: StargatePoolInfoList<Version>
}

export type StargatePoolsConfig<Version extends StargateVersion> = {
    [assetId: string]: StargatePoolConfig<Version>
}

export type AllStargatePoolsConfig = {
    [Version in StargateVersion]: StargatePoolsConfig<Version>
}

export interface StargatePoolConfigGetter {
    getPoolsConfig(filterHiddenPools?: boolean): AllStargatePoolsConfig
    getPoolConfig<T extends StargateVersion>(assetId: string, version: T): StargatePoolConfig<T>
    getPoolInfo(assetId: string, chainName: string, version: StargateVersion): StargatePoolInfo[typeof version]
    getPoolInfoByAddress(address: string, chainName: string, version: StargateVersion): StargatePoolInfo[typeof version]
    getAssetIds(version: StargateVersion): string[]

    getAssetIdsForChainName(chainName: string, version: StargateVersion): string[]

    getAssetIdFromAddress(chainName: string, address: string): { assetId: string; version: StargateVersion }
    getAssetIdFromSymbol(symbol: string): string

    getStargateTypeByAddress(chainName: string, address: string): StargateTypes

    isHiddenPool(version: StargateVersion, assetId: string, chainName: string): boolean
}

export class StargateConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'StargateConfigError'
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'NotFoundError'
    }
}

function cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
    if (obj instanceof Array) return obj.map((item) => cloneDeep(item)) as unknown as T
    if (typeof obj === 'object') {
        const clonedObj = {} as T
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clonedObj[key] = cloneDeep(obj[key])
            }
        }
        return clonedObj
    }
    return obj
}

abstract class BaseConfig<T> {
    protected config!: T

    protected getConfig(): T {
        return this.config
    }
}

const hiddenPools: Record<StargateVersion, Record<string, string[]>> = {
    [StargateVersion.V1]: {},
    [StargateVersion.V2]: {},
}

class BaseStargatePoolConfigGetter extends BaseConfig<AllStargatePoolsConfig> implements StargatePoolConfigGetter {
    filteredPoolsConfigs?: AllStargatePoolsConfig
    configRef?: AllStargatePoolsConfig // used to invalidate filteredPoolsConfigs if the underlying config has been changed

    protected constructor() {
        super()
    }

    public getPoolsConfig(filterHiddenPools = false): AllStargatePoolsConfig {
        const poolsConfigs = this.getConfig()
        if (!filterHiddenPools) return poolsConfigs
        if (this.filteredPoolsConfigs && poolsConfigs === this.configRef) {
            return this.filteredPoolsConfigs
        }
        this.configRef = poolsConfigs

        this.filteredPoolsConfigs = cloneDeep(poolsConfigs)
        for (const [version, assets] of Object.entries(hiddenPools)) {
            for (const [asset, chains] of Object.entries(assets)) {
                for (const chain of chains) {
                    delete this.filteredPoolsConfigs[version as StargateVersion][asset]?.poolInfo?.[chain]
                }
            }
        }
        return this.filteredPoolsConfigs
    }

    public getPoolConfig<T extends StargateVersion>(assetId: string, version: T): StargatePoolConfig<T> {
        const info = this.config[version][assetId]
        if (info == undefined) {
            throw new StargateConfigError(`pool config not found for assetId ${assetId} stargate version ${version}`)
        }
        return info
    }

    public getPoolInfo(assetId: string, chainName: string, version: StargateVersion): StargatePoolInfo[typeof version] {
        const info = this.config[version][assetId]?.poolInfo[chainName]
        if (info == undefined) {
            throw new StargateConfigError(
                `pool info not found for assetId ${assetId} on chain ${chainName} for stargate version ${version}`
            )
        }
        return info
    }

    public getPoolInfoByAddress(
        address: string,
        chainName: string,
        version: StargateVersion
    ): StargatePoolInfo[typeof version] {
        for (const [, data] of Object.entries(this.config[version])) {
            if (data.poolInfo[chainName]?.address?.toLowerCase() === address.toLowerCase()) {
                return {
                    ...data.poolInfo[chainName],
                    symbol: data.symbol,
                    sharedDecimals: data.sharedDecimals,
                } as StargatePoolInfo[typeof version]
            }
        }
        throw new Error(`pool config not found for chain ${chainName} pool ${address}`)
    }

    public getAssetIds(version: StargateVersion): string[] {
        return Object.keys(this.config[version])
    }

    public getAssetIdsForChainName(chainName: string, version: StargateVersion): string[] {
        return Object.entries(this.config[version])
            .filter(([, poolConfig]) => poolConfig && chainName in poolConfig.poolInfo)
            .map(([assetId]) => assetId)
    }

    public getAssetIdFromAddress(chainName: string, address: string): { assetId: string; version: StargateVersion } {
        for (const version of Object.values(StargateVersion)) {
            const found = Object.entries(this.config[version]).find(
                ([, configs]) => address.toLowerCase() === configs?.poolInfo[chainName]?.address?.toLowerCase()
            )
            if (found) return { assetId: found[0], version }
        }
        throw new NotFoundError(`assetId not found for pool ${address} on chain ${chainName}`)
    }

    public getAssetIdFromSymbol(symbol: string): string {
        const assets = new Set<string>()
        for (const [version, configs] of Object.entries(this.config)) {
            for (const [assetId, config] of Object.entries(configs)) {
                for (const poolConfig of Object.values((config as StargatePoolConfig<StargateVersion>).poolInfo)) {
                    if (poolConfig && poolConfig.token.symbol === symbol) assets.add(assetId)
                }
            }
        }
        if (assets.size == 1) return Array.from(assets)[0]
        if (assets.size > 1) {
            throw new StargateConfigError(`duplicate assetIds found for symbol ${symbol}: ${Array.from(assets)}`)
        }
        throw new NotFoundError(`assetId not found for symbol ${symbol}`)
    }

    public getStargateTypeByAddress(chainName: string, address: string): StargateTypes {
        for (const version of Object.values(StargateVersion)) {
            for (const configs of Object.values(this.config[version])) {
                const info = configs?.poolInfo[chainName]
                if (info?.address?.toLowerCase() === address.toLowerCase()) {
                    return info.stargateType
                }
            }
        }
        throw new NotFoundError(`No StargateType found for address: ${address}`)
    }

    public isHiddenPool(version: StargateVersion, assetId: string, chainName: string): boolean {
        return !!hiddenPools[version]?.[assetId]?.includes(chainName)
    }
}

export class LocalStargatePoolConfigGetter extends BaseStargatePoolConfigGetter {
    protected constructor(configs: {
        [Version in StargateVersion]: StargatePoolsConfig<Version>
    }) {
        super()
        this.config = configs
    }

    public static async create(filePath: string): Promise<StargatePoolConfigGetter> {
        const config = JSON.parse((await fs.readFile(filePath)).toString('utf-8')) as {
            [Version in StargateVersion]: StargatePoolsConfig<Version>
        }
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
        const emptyConfig = {
            [StargateVersion.V2]: {},
        }

        // Write temporary config and use existing create method
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

export enum UlnVersion {
    V1 = 'V1',
    V2 = 'V2',
    V300 = 'V300', // simpleMessageLib
    V301 = 'V301',
    V302 = 'V302',
    ReadV1002 = 'ReadV1002',
}

export interface UriWithHeaders {
    uri: string
    headers?: { [header: string]: string }
}

export interface ProviderConfig {
    uris: string[] | UriWithHeaders[]
    quorum?: number
}

export interface ProviderConfigs {
    [chainName: string]: ProviderConfig
}

export interface ProviderConfigGetter {
    getProviderConfig(chainName: string): ProviderConfig
    getProviderConfigs(): ProviderConfigs
}

export interface BootstrapChainConfig {
    chainNames: string[]
    environment: string
    providers: {
        [chainName: string]: Provider
    }
    isOnForkedChains: boolean
    initialTokensOverrides?: {
        [chainName: string]: string | { [key: string]: string }
    }
    chainNamesAutoWithdrawFromULN?: string[]
    supportedChainNames?: string[]
    providerConfigGetter: ProviderConfigGetter
}

export interface BootstrapChainConfigWithUln extends BootstrapChainConfig {
    supportedUlnVersions: UlnVersion[]
}

class LocalProviderConfigGetter implements ProviderConfigGetter {
    private providerConfigs: ProviderConfigs

    constructor(providerConfigs: ProviderConfigs) {
        this.providerConfigs = providerConfigs
    }

    getProviderConfig(chainName: string): ProviderConfig {
        const config = this.providerConfigs[chainName]
        if (!config) {
            throw new Error(`Provider config not found for chain: ${chainName}`)
        }
        return config
    }

    getProviderConfigs(): ProviderConfigs {
        return this.providerConfigs
    }
}

export const createProviderFromConfig = (config: ProviderConfig, chainName: string): Provider => {
    if (config.uris.length === 0) {
        throw new Error(`No RPC URLs available for chain: ${chainName}`)
    }

    // Since the RPC URL already handles fallback internally, we only need a simple JsonRpcProvider
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

const getAvailableChainNamesFromDeployments = (environment: string): string[] => {
    try {
        const deploymentsPath = path.join(__dirname, '..', 'deployments')
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
            filteredDirs = deploymentDirs
        }

        const chainNames = filteredDirs
            .map((dir: string) => dir.replace(/-mainnet$|-testnet$/, ''))
            .filter((name: string) => name.length > 0)

        return Array.from(new Set(chainNames))
    } catch (error) {
        console.warn(`Failed to read deployment directories: ${error}`)
        return []
    }
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

export const getBootstrapChainConfigFromArgs = async (
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

    const providerConfigGetter = new LocalProviderConfigGetter(providerConfigs)

    return {
        providers,
        providerConfigGetter,
        environment: args.environment,
        chainNames: validChainNames,
        initialTokensOverrides,
        isOnForkedChains: !args.noFork && args.environment !== 'localnet', // localnet is never forked
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

// TODO see if this can be refactored with getAvailableChainNamesFromDeployments
export const getAvailableChainNamesByEnvironment = (environment: string): string[] => {
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
        } else if (environment === 'localnet' || environment === 'sandbox') {
            // Handle local environments - look for sandbox-local directories
            filteredDirs = deploymentDirs.filter((dir: string) => dir.endsWith('-sandbox-local'))
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
                } else if (dir.endsWith('-sandbox-local')) {
                    return dir.replace(/-sandbox-local$/, '')
                } else {
                    return dir
                }
            })
            .filter((name: string) => name.length > 0)

        // Return unique chain names
        return Array.from(new Set(chainNames)).sort()
    } catch (error) {
        console.warn(`Failed to read deployment directories for environment ${environment}: ${error}`)
        return []
    }
}

export const bootstrapLoggerConfigFromArgs: LoggerOptions = {
    level: 'debug',
    format: format.combine(format.prettyPrint(), format.colorize({ all: true })),
    transports: [new transports.Console()],
}
