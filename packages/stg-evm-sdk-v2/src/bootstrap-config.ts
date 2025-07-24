import { promises as fs } from 'fs'
import * as path from 'path'

import { JsonRpcProvider } from '@ethersproject/providers'

import { StargateVersion } from './checkDeployment/utils'

import type { Provider } from '@ethersproject/providers'

// Adapted types from external packages
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

// Custom error classes
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

// Simple deep clone utility
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

// Base config class
abstract class BaseConfig<T> {
    protected config!: T

    protected getConfig(): T {
        return this.config
    }
}

// Hidden pools configuration - can be extended as needed
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
        // need to deep clone to avoid modifying the actual config object
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

// Helper function to get the correct config path based on environment
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

// Main export function that matches the original interface
export const getLocalStargatePoolConfigGetterFromArgs = async (
    environment: string
): Promise<StargatePoolConfigGetter> => {
    return await LocalStargatePoolConfigGetter.create(getStargateDynamicConfigPath('stargatePoolConfig', environment))
}

// Bootstrap Chain Configuration Types and Functions
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

/**
 * ProviderConfig is the data-only interface used to serialize/deserialize ProviderConfig for a given chainName.
 */
export interface ProviderConfig {
    uris: string[] | UriWithHeaders[]
    quorum?: number
}

/**
 * ProviderConfigs is the data-only interface used to map a chainName to its corresponding ProviderConfig.
 */
export interface ProviderConfigs {
    [chainName: string]: ProviderConfig
}

/**
 * ProviderConfigGetter provides the ability to extract a ProviderConfig for a given chainName.
 */
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
    // can filter for specific chains for chain sdks when generating activities
    supportedChainNames?: string[]
    providerConfigGetter: ProviderConfigGetter
}

export interface BootstrapChainConfigWithUln extends BootstrapChainConfig {
    supportedUlnVersions: UlnVersion[]
}

// Provider Config Implementation
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

/**
 * A custom provider wrapper that implements sequential fallback logic
 */
class SequentialFallbackProvider {
    private providers: JsonRpcProvider[]
    private uris: string[]
    private chainName: string
    private currentProviderIndex = 0
    private networkPromise: Promise<any> | null = null

    constructor(uris: string[], chainName: string) {
        this.uris = uris
        this.chainName = chainName
        this.providers = uris.map((uri) => new JsonRpcProvider(uri))
    }

    private async tryNextProvider(): Promise<JsonRpcProvider> {
        while (this.currentProviderIndex < this.providers.length) {
            const provider = this.providers[this.currentProviderIndex]
            try {
                // Test the provider with a simple call
                await provider.getNetwork()
                return provider
            } catch (error: any) {
                const rpcUrl = this.uris[this.currentProviderIndex]
                console.warn(
                    `[${this.chainName}] RPC provider failed network detection: ${rpcUrl} - ${error?.message || error}`
                )
                this.currentProviderIndex++
            }
        }
        throw new Error('All providers failed network detection')
    }

    private async getCurrentProvider(): Promise<JsonRpcProvider> {
        if (!this.networkPromise) {
            this.networkPromise = this.tryNextProvider()
        }
        return this.networkPromise
    }

    // Proxy all Provider methods to the current working provider
    async getNetwork() {
        const provider = await this.getCurrentProvider()
        return provider.getNetwork()
    }

    async getBlockNumber() {
        const provider = await this.getCurrentProvider()
        return provider.getBlockNumber()
    }

    async getBalance(addressOrName: string, blockTag?: any) {
        const provider = await this.getCurrentProvider()
        return provider.getBalance(addressOrName, blockTag)
    }

    async getTransactionCount(addressOrName: string, blockTag?: any) {
        const provider = await this.getCurrentProvider()
        return provider.getTransactionCount(addressOrName, blockTag)
    }

    async getCode(addressOrName: string, blockTag?: any) {
        const provider = await this.getCurrentProvider()
        return provider.getCode(addressOrName, blockTag)
    }

    async getStorageAt(addressOrName: string, position: any, blockTag?: any) {
        const provider = await this.getCurrentProvider()
        return provider.getStorageAt(addressOrName, position, blockTag)
    }

    async sendTransaction(signedTransaction: string) {
        const provider = await this.getCurrentProvider()
        return provider.sendTransaction(signedTransaction)
    }

    async call(transaction: any, blockTag?: any) {
        const provider = await this.getCurrentProvider()
        return provider.call(transaction, blockTag)
    }

    async estimateGas(transaction: any) {
        const provider = await this.getCurrentProvider()
        return provider.estimateGas(transaction)
    }

    async getBlock(blockHashOrBlockTag: any, includeTransactions?: boolean) {
        const provider = await this.getCurrentProvider()
        if (includeTransactions !== undefined) {
            // If includeTransactions is specified, we need to handle it differently
            // For now, just ignore the parameter as it's not supported in this ethers version
            return provider.getBlock(blockHashOrBlockTag)
        }
        return provider.getBlock(blockHashOrBlockTag)
    }

    async getTransaction(transactionHash: string) {
        const provider = await this.getCurrentProvider()
        return provider.getTransaction(transactionHash)
    }

    async getTransactionReceipt(transactionHash: string) {
        const provider = await this.getCurrentProvider()
        return provider.getTransactionReceipt(transactionHash)
    }

    async getLogs(filter: any) {
        const provider = await this.getCurrentProvider()
        return provider.getLogs(filter)
    }

    async resolveName(name: string) {
        const provider = await this.getCurrentProvider()
        return provider.resolveName(name)
    }

    async lookupAddress(address: string) {
        const provider = await this.getCurrentProvider()
        return provider.lookupAddress(address)
    }

    async waitForTransaction(transactionHash: string, confirmations?: number, timeout?: number) {
        const provider = await this.getCurrentProvider()
        return provider.waitForTransaction(transactionHash, confirmations, timeout)
    }

    // Add other necessary methods as needed
    on(eventName: any, listener: any) {
        // For events, we'll need to handle this differently
        // For now, delegate to the first provider
        return this.providers[0].on(eventName, listener)
    }

    off(eventName: any, listener?: any) {
        return this.providers[0].off(eventName)
    }

    removeAllListeners(eventName?: any) {
        return this.providers[0].removeAllListeners(eventName)
    }

    // Make it compatible with ethers Provider interface
    get connection() {
        return this.providers[this.currentProviderIndex]?.connection
    }

    get _isProvider() {
        return true
    }
}

/**
 * Converts a ProviderConfig object to an actual ethers Provider instance
 */
export const createProviderFromConfig = (config: ProviderConfig, chainName: string): Provider => {
    // Handle UriWithHeaders type
    const uris = config.uris.map((uri) => {
        if (typeof uri === 'string') {
            return uri
        } else {
            // For UriWithHeaders, we'll use the uri directly
            // Note: ethers doesn't directly support custom headers in JsonRpcProvider
            // You might need to implement custom logic if headers are required
            return uri.uri
        }
    })

    // If only one URI, create a simple JsonRpcProvider
    if (uris.length === 1) {
        return new JsonRpcProvider(uris[0])
    }

    // If multiple URIs, create our custom SequentialFallbackProvider
    return new SequentialFallbackProvider(uris, chainName) as any
}

// Helper function to load provider configurations from file
const loadProviderConfigs = async (environment: string): Promise<ProviderConfigs> => {
    try {
        const providersPath = path.join(__dirname, 'configs', 'providers', environment, 'providers.json')
        const providerData = await fs.readFile(providersPath, 'utf-8')
        return JSON.parse(providerData) as ProviderConfigs
    } catch (error) {
        throw new Error(`Failed to load provider configs for environment ${environment}: ${error}`)
    }
}

// Helper function to get available chain names from providers config
const getAvailableChainNames = (providerConfigs: ProviderConfigs): string[] => {
    return Object.keys(providerConfigs)
}

// Helper function to filter chains based on 'only' parameter
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
                        // For EVM chains, just use the token override directly
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

// Main bootstrap chain config function
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
    // Load provider configurations
    const providerConfigs = await loadProviderConfigs(args.environment)
    const availableChainNames = getAvailableChainNames(providerConfigs)

    // Filter chains based on 'only' parameter
    const { chainNames: filteredChainNames, initialTokensOverrides } = getAvailableChainsFromArgs(
        args,
        availableChainNames
    )

    // Apply additional chain filtering if provided
    const chainNames = isSupportedChainName
        ? filteredChainNames.filter((chainName) => isSupportedChainName(chainName, args.environment))
        : filteredChainNames

    if (!chainNames.length) {
        throw new Error('No chainNames after applying filters')
    }

    // Create providers object with actual ethers Provider instances
    const providers: { [chainName: string]: Provider } = {}
    for (const chainName of chainNames) {
        providers[chainName] = createProviderFromConfig(providerConfigs[chainName], chainName)
    }

    // Create provider config getter
    const providerConfigGetter = new LocalProviderConfigGetter(providerConfigs)

    return {
        providers,
        providerConfigGetter,
        environment: args.environment,
        chainNames,
        initialTokensOverrides,
        isOnForkedChains: !args.noFork && args.environment !== 'localnet', // localnet is never forked
    }
}

// Main export function that adds ULN support
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
