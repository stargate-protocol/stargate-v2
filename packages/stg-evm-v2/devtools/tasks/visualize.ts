import assert from 'assert'

import { ASSETS, AssetId, StargateType, TokenName } from '@stargatefinance/stg-definitions-v2'
import { diff as diffString } from 'deep-object-diff'
import { subtask, task } from 'hardhat/config'
import { table } from 'table'

import { OmniAddress, OmniGraph, isDeepEqual, isZero } from '@layerzerolabs/devtools'
import { makeZeroAddress } from '@layerzerolabs/devtools-evm'
import {
    createConnectedContractFactory,
    getNetworkNameForEid,
    inheritTask,
    types,
} from '@layerzerolabs/devtools-evm-hardhat'
import { createLogger, printRecord, setDefaultLogLevel } from '@layerzerolabs/io-devtools'
import { OAppOmniGraph } from '@layerzerolabs/ua-devtools'
import {
    OAppOmniGraphHardhatSchema,
    SUBTASK_LZ_OAPP_CONFIG_LOAD,
    SubtaskLoadConfigTaskArgs,
} from '@layerzerolabs/ua-devtools-evm-hardhat'

import {
    AssetFactory,
    AssetOmniGraph,
    AssetOmniGraphHardhatSchema,
    createAssetFactory,
    loadAssetState,
} from '../src/asset'
import {
    CreditMessagingEdgeConfig,
    CreditMessagingOmniGraph,
    CreditMessagingOmniGraphHardhatSchema,
    createCreditMessagingFactory,
    loadCreditMessagingState,
} from '../src/credit-messaging'
import { createERC20Factory } from '../src/erc20'
import { FeeLibV1OmniGraph, FeeLibV1OmniGraphHardhatSchema, loadFeeLibV1State } from '../src/feeLib_v1'
import { MessagingOmniGraph } from '../src/messaging'
import { MintableOmniGraph, MintableOmniGraphHardhatSchema, loadMintableState } from '../src/mintable'
import { RewarderOmniGraph, loadRewarderState } from '../src/rewarder'
import { RewarderOmniGraphHardhatSchema } from '../src/rewarder/schema'
import { StakingOmniGraph, StakingOmniGraphHardhatSchema, loadStakingState } from '../src/staking'
import {
    TokenMessagingEdgeConfig,
    TokenMessagingOmniGraph,
    TokenMessagingOmniGraphHardhatSchema,
    loadTokenMessagingState,
} from '../src/token-messaging'
import { TreasurerOmniGraph, TreasurerOmniGraphHardhatSchema, loadTreasurerState } from '../src/treasurer'

import {
    SUBTASK_LZ_OAPP_STATE_LOAD,
    SUBTASK_LZ_OAPP_VISUALIZE_CONFIGURE,
    TASK_LZ_OAPP_VISUALIZE,
    TASK_STG_VISUALIZE_ASSET,
    TASK_STG_VISUALIZE_CREDIT_MESSAGING,
    TASK_STG_VISUALIZE_FEELIBV1,
    TASK_STG_VISUALIZE_OFT,
    TASK_STG_VISUALIZE_REWARDER,
    TASK_STG_VISUALIZE_STAKING,
    TASK_STG_VISUALIZE_TOKEN,
    TASK_STG_VISUALIZE_TOKEN_MESSAGING,
    TASK_STG_VISUALIZE_TREASURER,
} from './constants'

import type { ActionType } from 'hardhat/types'

/**
 * Returns a JSON-serialized version of a string, replacing all `BigInt`
 * instances with strings
 */
const printJson = (obj: unknown): string =>
    JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString(10) : value), 2)

interface NamedRecord<V> {
    chain?: string
    contract?: string
    record?: Record<string, V>
    match?: boolean
}

interface AssetInfo {
    [key: string]: string | number | OmniAddress | StargateType | undefined
    assetName: string
    eid: number
    address?: OmniAddress
    tokenAddress?: OmniAddress
    name: string
    symbol: string
    network: string
    type?: StargateType
    lpTokenSymbol: string
    lpTokenName: string
    decimals?: number
}

interface SubtaskLoadStateTaskArgs {
    configGraph: OmniGraph
}

interface SubtaskVisualizeTaskArgs {
    graphConfig: OAppOmniGraph
    graphState: OAppOmniGraph
    contractName: string
    diff: boolean
    fullOutput: boolean
}

interface TaskArgs {
    oappConfig: string
    logLevel?: string
    contractName: string
    /**
     * Whether to show only the differential changes
     *
     * This is useful when you want to see only the changes that will be made,
     * not the whole state-config comparison.
     */
    diff?: boolean
    fullOutput?: boolean
}

const visualizeAction: ActionType<TaskArgs> = async (
    { oappConfig: oappConfigPath, logLevel = 'info', contractName, diff = false, fullOutput = false },
    hre
): Promise<void> => {
    // We'll set the global logging level to get as much info as needed
    setDefaultLogLevel(logLevel)

    // And we'll create a logger for ourselves
    const logger = createLogger()

    // Now we can load and validate the config
    logger.debug(`Using ${SUBTASK_LZ_OAPP_CONFIG_LOAD} subtask to load the config`)
    const graphConfig: OAppOmniGraph = await hre.run(SUBTASK_LZ_OAPP_CONFIG_LOAD, {
        configPath: oappConfigPath,
        schema: OAppOmniGraphHardhatSchema,
        task: TASK_LZ_OAPP_VISUALIZE,
    } satisfies SubtaskLoadConfigTaskArgs)

    // At this point we are ready to get the on-chain state
    logger.verbose(`Getting the on-chain state`)

    logger.debug(`Using ${SUBTASK_LZ_OAPP_STATE_LOAD} subtask to get the state`)
    const graphState: OAppOmniGraph = adaptEnforcedOptions(
        await hre.run(SUBTASK_LZ_OAPP_STATE_LOAD, {
            configGraph: graphConfig,
        } satisfies SubtaskLoadStateTaskArgs)
    )

    logger.debug(`Using ${SUBTASK_LZ_OAPP_VISUALIZE_CONFIGURE} subtask to compare the configuration and the state`)
    const records: NamedRecord<string>[] = await hre.run(SUBTASK_LZ_OAPP_VISUALIZE_CONFIGURE, {
        graphConfig,
        graphState,
        contractName,
        diff,
        fullOutput,
    } satisfies SubtaskVisualizeTaskArgs)

    logger.verbose(`Compared both OmniGraphs`)

    // If there are no transactions that need to be executed, we'll just exit
    if (records.length === 0) {
        logger.info(`There were no differences`)
        return
    }

    if (fullOutput) {
        printVerboseRecords(records)
    } else {
        printQuietRecords(records)
    }
}

function printQuietRecords(records: NamedRecord<string>[]) {
    const logger = createLogger()
    // Tell the user about the transactions
    for (const record of records) {
        if (record.record) logger.info(`${record.chain}.${record.contract}:\n${record.record.diff}`)
    }
}

function printVerboseRecords(records: NamedRecord<string>[]) {
    const logger = createLogger()
    // Tell the user about the transactions
    for (const record of records) {
        if (record.record)
            logger.info(
                '\n' +
                    printRecord({
                        settings: record.record,
                        equal: record.match,
                        contract: record.contract,
                        chain: record.chain,
                    })
            )
    }
}

// TODO: Get the state graph from the deployments

task(TASK_LZ_OAPP_VISUALIZE, 'Visualize LayerZero OApp', visualizeAction)
    .addParam('oappConfig', 'Path to your LayerZero OApp config', undefined, types.string)
    .addParam('logLevel', 'Logging level. One of: error, warn, info, verbose, debug, silly', 'info', types.logLevel)
    .addParam('contractName', 'Name of the contract to visualize', undefined, types.string)
    .addFlag('fullOutput', 'Display whole objects instead of just the differences')
    .addFlag('diff', 'Show only the differences between the two OmniGraphs')

const dropUndefined = <T>(obj: T): T => JSON.parse(printJson(obj))

const compareGraphsAction: ActionType<SubtaskVisualizeTaskArgs> = async ({
    graphConfig,
    graphState,
    contractName,
    diff,
}): Promise<NamedRecord<string>[]> => {
    const logger = createLogger()
    const comparisons: NamedRecord<string>[] = []
    for (const contractConfig of graphConfig.contracts) {
        assert(contractConfig.config, 'This will never happen')

        contractConfig.config = dropUndefined(contractConfig.config)
        const comparison: NamedRecord<string> = {
            chain: getNetworkNameForEid(contractConfig.point.eid),
            contract: contractName,
        }
        const contractState = graphState.contracts.find((contract) => contract.point.eid === contractConfig.point.eid)
        if (!contractState) {
            // TODO Be smarter about this
            logger.error(
                `${contractName} no found in ${getNetworkNameForEid(contractConfig.point.eid)} not found in state`
            )
            continue
        }

        assert(contractState.config, 'This will never happen')

        logger.verbose(`Comparing contract ${contractName} in ${getNetworkNameForEid(contractConfig.point.eid)}`)

        const areEqual = isDeepEqual(contractConfig.config, contractState.config)
        comparison.match = areEqual
        if (!areEqual || !diff) {
            comparison.record = {
                config: printJson(contractConfig.config),
                state: printJson(contractState.config),
                diff: printJson(diffString(contractConfig.config, contractState.config)),
            }
            comparisons.push(comparison)
        }
    }

    for (const connectionConfig of graphConfig.connections) {
        assert(connectionConfig.config, 'This will never happen')
        connectionConfig.config = dropUndefined(connectionConfig.config)
        const comparison: NamedRecord<string> = {
            chain: `from: ${getNetworkNameForEid(connectionConfig.vector.from.eid)} to: ${getNetworkNameForEid(connectionConfig.vector.to.eid)}`,
            contract: contractName,
        }
        const connectionState = graphState.connections.find(
            (connectionState) =>
                connectionState.vector.from.eid === connectionConfig.vector.from.eid &&
                connectionState.vector.to.eid === connectionConfig.vector.to.eid
        )
        if (!connectionState) {
            logger.error(`${contractName} no connection found ${comparison.chain} in state`)
            continue
        }
        assert(connectionState.config, 'This will never happen')

        logger.verbose(`Comparing connections for ${contractName} ${comparison.chain}`)

        const areEqual = isDeepEqual(connectionConfig.config, connectionState.config)
        comparison.match = areEqual
        if (!areEqual || !diff) {
            comparison.record = {
                config: printJson(connectionConfig.config),
                state: printJson(connectionState.config),
                diff: printJson(diffString(connectionConfig.config, connectionState.config)),
            }
            comparisons.push(comparison)
        }
    }

    return Promise.resolve(comparisons)
}

const printWiredAssets = async (configGraph: CreditMessagingOmniGraph) => {
    const assets = await getWiredAssets(configGraph as CreditMessagingOmniGraph)
    const assetPromises: Promise<void>[] = []
    const tokenPromises: Promise<void>[] = []
    for (const assetInfoList of assets.values()) {
        for (const assetInfo of assetInfoList) {
            assetPromises.push(getOnChainAssetsInfo(assetInfo))
        }
    }
    await Promise.all(assetPromises)

    for (const assetInfoList of assets.values()) {
        for (const assetInfo of assetInfoList) {
            tokenPromises.push(getOnChainTokenInfo(assetInfo))
        }
    }
    await Promise.all(tokenPromises)

    await printAssetsInfo(assets)
}

const assetIdToName = (assetId: number) =>
    Object.keys(ASSETS).find((key) => ASSETS[key as TokenName].assetId === assetId) || 'UNKNOWN'

const getWiredAssets = async (configGraph: CreditMessagingOmniGraph) => {
    const logger = createLogger()
    const createSdk = createCreditMessagingFactory(createConnectedContractFactory())

    const promises: Promise<string>[] = []
    const assets = new Map<AssetId, AssetInfo[]>()
    for (const { point, config } of configGraph.contracts) {
        const sdk = await createSdk(point)

        logger.verbose(`Querying assets on ${getNetworkNameForEid(point.eid)}...`)

        for (const asset in config.assets) {
            const assetId = config.assets[asset]
            if (!assets.has(assetId)) {
                assets.set(assetId, [])
            }

            const assetInfo = assets.get(assetId)
            assert(assetInfo, 'This will never happen')

            const info = {
                assetName: assetIdToName(assetId),
                eid: point.eid,
                address: '',
                tokenAddress: makeZeroAddress(),
                name: 'NONE',
                symbol: 'NONE',
                network: getNetworkNameForEid(point.eid),
                lpTokenSymbol: '',
                lpTokenName: '',
                decimals: 0,
            }
            assetInfo.push(info)
            promises.push(sdk.getAsset(assetId).then((address) => (info.address = address ?? '')))
        }
    }

    await Promise.all(promises)
    return assets
}

const getOnChainAssetsInfo = async (assetInfo: AssetInfo) => {
    const logger = createLogger()
    const contractFactory = createConnectedContractFactory() // createContractFactory(hre)

    if (!assetInfo.address) {
        return
    }
    logger.verbose(`Querying ${assetInfo.assetName} on ${getNetworkNameForEid(assetInfo.eid)}...`)

    const assetFactory: AssetFactory = createAssetFactory(contractFactory)
    const assetSdk = await assetFactory({ address: assetInfo.address, eid: assetInfo.eid })

    const assetType = await assetSdk.getStargateType()
    if (assetType === StargateType.Pool) {
        const lpTokenAddress = await assetSdk.getLPToken()
        const lpTokenSdk = await createERC20Factory(createConnectedContractFactory())({
            eid: assetInfo.eid,
            contractName: 'ERC20',
            address: lpTokenAddress,
        })

        assetInfo.lpTokenSymbol = await lpTokenSdk.symbol()
        assetInfo.lpTokenName = await lpTokenSdk.name()
    }
    assetInfo.type = assetType

    const tokenAddress = await assetSdk.getToken()
    if (isZero(tokenAddress)) {
        assetInfo.name = ''
        assetInfo.symbol = ''
        assetInfo.type = assetType === StargateType.Pool ? StargateType.Native : assetType
    }
    assetInfo.tokenAddress = tokenAddress
}

const getOnChainTokenInfo = async (assetInfo: AssetInfo) => {
    const contractFactory = createConnectedContractFactory()
    if (isZero(assetInfo.tokenAddress)) {
        return
    }

    const tokenSdk = await contractFactory({
        eid: assetInfo.eid,
        contractName: 'ERC20',
        address: assetInfo.tokenAddress,
    })

    assetInfo.name = await tokenSdk.contract.name()
    assetInfo.symbol = await tokenSdk.contract.symbol()
    assetInfo.decimals = await tokenSdk.contract.decimals()
}

const printAssetsInfo = async (assets: Map<AssetId, AssetInfo[]>) => {
    const logger = createLogger()
    for (const [_assetId, assetInfoList] of assets) {
        assetInfoList.sort((a, b) => a.network.localeCompare(b.network))

        const header = [
            'Asset Name',
            'EID',
            'Address',
            'Token Address',
            'Token Name',
            'Token Symbol',
            'Network',
            'LP Token Symbol',
            'LP Token Name',
            'Decimals',
            'Type',
        ]

        logger.info(
            '\n' +
                table(
                    [header].concat(
                        assetInfoList.map((assetInfo) => [
                            assetInfo.assetName ?? '',
                            assetInfo.eid?.toString() ?? ' ',
                            assetInfo.address ?? '',
                            assetInfo.tokenAddress ?? '',
                            assetInfo.name ?? '',
                            assetInfo.symbol ?? '',
                            assetInfo.network ?? '',
                            assetInfo.lpTokenSymbol ?? '',
                            assetInfo.lpTokenName ?? '',
                            assetInfo.decimals?.toString() ?? '',
                            assetInfo.type ?? '',
                        ])
                    ),
                    {
                        header: { content: assetInfoList[0].assetName },
                    }
                )
        )
    }
}

task(TASK_STG_VISUALIZE_TOKEN, 'Get wired assets')
    .addParam('oappConfig', 'Path to your LayerZero OApp config', undefined, types.string)
    .setAction(async (args, hre) => {
        setDefaultLogLevel('verbose')
        const configGraph = await hre.run(SUBTASK_LZ_OAPP_CONFIG_LOAD, {
            configPath: args.oappConfig,
            schema: OAppOmniGraphHardhatSchema,
            task: TASK_LZ_OAPP_VISUALIZE,
        } satisfies SubtaskLoadConfigTaskArgs)

        return printWiredAssets(configGraph as CreditMessagingOmniGraph)
    })

subtask(SUBTASK_LZ_OAPP_VISUALIZE_CONFIGURE, 'Compare OmniGraphs', compareGraphsAction)
    .addParam('graphConfig', 'The configuration OmniGraph', undefined, types.any)
    .addParam('graphState', 'The state OmniGraph', undefined, types.any)
    .addFlag('diff', 'Show only the differences between the two OmniGraphs')

const visualizeTask = inheritTask(TASK_LZ_OAPP_VISUALIZE)

function setMaxAssetId(configGraph: MessagingOmniGraph): MessagingOmniGraph {
    for (const { config } of configGraph.contracts) {
        let maxAssetId = 0
        for (const asset in config.assets) {
            const assetId = config.assets[asset]
            if (assetId > maxAssetId) {
                maxAssetId = assetId
            }
        }
        config.maxAssetId = maxAssetId
    }
    return configGraph
}

function stripAssetId(configGraph: AssetOmniGraph): AssetOmniGraph {
    for (const { config } of configGraph.contracts) {
        delete config.assetId
    }
    return configGraph
}

// TODO: Fix this
function adaptEnforcedOptions<TNodeConfig, TEdgeConfig extends CreditMessagingEdgeConfig | TokenMessagingEdgeConfig>(
    graph: OmniGraph<TNodeConfig, TEdgeConfig>
): OmniGraph<TNodeConfig, TEdgeConfig> {
    for (const { config } of graph.connections) {
        if (config && config.enforcedOptions) {
            for (const option of config.enforcedOptions) {
                if ('value' in option && (option.value === '0' || option.value === 0n)) {
                    delete option.value
                }
                if ('gas' in option && (typeof option.gas === 'bigint' || typeof option.gas === 'string')) {
                    option.gas = Number(option.gas)
                }
            }
        }
    }

    return graph
}

/**
 * Visualization task for CreditMessaging contracts
 */
visualizeTask(TASK_STG_VISUALIZE_CREDIT_MESSAGING).setAction(async (args, hre) => {
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load CreditMessaging config',
        (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
            runSuper({
                ...args,
                schema: CreditMessagingOmniGraphHardhatSchema,
            }).then((graph) => setMaxAssetId(graph))
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load CreditMessaging state', (args: SubtaskLoadStateTaskArgs) =>
        loadCreditMessagingState(args.configGraph as CreditMessagingOmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})

/**
 * Visualization task for TokenMessaging contracts
 */
visualizeTask(TASK_STG_VISUALIZE_TOKEN_MESSAGING).setAction(async (args, hre) => {
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load TokenMessaging config',
        (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
            runSuper({
                ...args,
                schema: TokenMessagingOmniGraphHardhatSchema,
            }).then((graph) => setMaxAssetId(graph))
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load TokenMessaging state', (args: SubtaskLoadStateTaskArgs) =>
        loadTokenMessagingState(args.configGraph as TokenMessagingOmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})

/**
 * Visualization task for FeeLibV1 contracts
 */
visualizeTask(TASK_STG_VISUALIZE_FEELIBV1).setAction(async (args, hre) => {
    subtask(
        SUBTASK_LZ_OAPP_CONFIG_LOAD,
        'Load FeeLibV1 messaging config',
        (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
            runSuper({
                ...args,
                schema: FeeLibV1OmniGraphHardhatSchema,
            })
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load FeeLibV1 state', (args: SubtaskLoadStateTaskArgs) =>
        loadFeeLibV1State(args.configGraph as FeeLibV1OmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})

/**
 * Visualization task for Asset contracts
 */
visualizeTask(TASK_STG_VISUALIZE_ASSET).setAction(async (args, hre) => {
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load Asset config', (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
        runSuper({
            ...args,
            schema: AssetOmniGraphHardhatSchema,
        }).then((graph) => stripAssetId(graph))
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load Asset state', (args: SubtaskLoadStateTaskArgs) =>
        loadAssetState(args.configGraph as AssetOmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})

/**
 * Visualization task for Treasurer contracts
 */
visualizeTask(TASK_STG_VISUALIZE_TREASURER).setAction(async (args, hre) => {
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load Treasurer config', (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
        runSuper({
            ...args,
            schema: TreasurerOmniGraphHardhatSchema,
        })
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load Treasurer state', (args: SubtaskLoadStateTaskArgs) =>
        loadTreasurerState(args.configGraph as TreasurerOmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})

/**
 * Visualization task for Staking contracts
 */
visualizeTask(TASK_STG_VISUALIZE_STAKING).setAction(async (args, hre) => {
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load Staking config', (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
        runSuper({
            ...args,
            schema: StakingOmniGraphHardhatSchema,
        })
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load Staking state', (args: SubtaskLoadStateTaskArgs) =>
        loadStakingState(args.configGraph as StakingOmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})

/**
 * Visualization task for Rewarder contracts
 */
visualizeTask(TASK_STG_VISUALIZE_REWARDER).setAction(async (args, hre) => {
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load Rewarder config', (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
        runSuper({
            ...args,
            schema: RewarderOmniGraphHardhatSchema,
        })
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load Rtaking state', (args: SubtaskLoadStateTaskArgs) =>
        loadRewarderState(args.configGraph as RewarderOmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})

/**
 * Visualization task for OFT contracts
 */
visualizeTask(TASK_STG_VISUALIZE_OFT).setAction(async (args, hre) => {
    subtask(SUBTASK_LZ_OAPP_CONFIG_LOAD, 'Load OFT config', (args: SubtaskLoadConfigTaskArgs, _hre, runSuper) =>
        runSuper({
            ...args,
            schema: MintableOmniGraphHardhatSchema,
        })
    )

    subtask(SUBTASK_LZ_OAPP_STATE_LOAD, 'Load OFT state', (args: SubtaskLoadStateTaskArgs) =>
        loadMintableState(args.configGraph as MintableOmniGraph)
    )

    return hre.run(TASK_LZ_OAPP_VISUALIZE, args)
})
