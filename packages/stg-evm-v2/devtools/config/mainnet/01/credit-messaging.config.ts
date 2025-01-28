import { CreditMessagingEdgeConfig, CreditMessagingNodeConfig } from '@stargatefinance/stg-devtools-v2'

import { OmniGraphHardhat, createGetHreByEid } from '@layerzerolabs/devtools-evm-hardhat'
import { endpointIdToChain } from '@layerzerolabs/lz-definitions'

import { generateCreditMessagingConfig, getSafeAddress } from '../../utils'
import {
    onAbstract,
    onArb,
    onAurora,
    onAvax,
    onBase,
    onBera,
    onBsc,
    onCodex,
    onCoredao,
    onDegen,
    onEbi,
    onEth,
    onFlare,
    onFlow,
    onFuse,
    onGlue,
    onGnosis,
    onGravity,
    onHemi,
    onInk,
    onIota,
    onIslander,
    onKava,
    onKlaytn,
    onLightlink,
    onMantle,
    onMetis,
    onOpt,
    onPeaq,
    onPlume,
    onPolygon,
    onRarible,
    onRootstock,
    onScroll,
    onSei,
    onSoneium,
    onSuperposition,
    onTaiko,
    onXchain,
    onZkConsensys,
} from '../utils'

import { DEFAULT_PLANNER } from './constants'
import { getMessagingAssetConfig } from './shared'

const contract = { contractName: 'CreditMessaging' }

export default async (args: {
    fromChains: string
    toChains: string
}): Promise<OmniGraphHardhat<CreditMessagingNodeConfig, CreditMessagingEdgeConfig>> => {
    console.log('ravina args in config file: ', args)
    console.log('ravina toChains: ', args.toChains)
    const fromChains = args.fromChains === 'all' ? null : args.fromChains.split(',')
    const toChains = args.toChains === 'all' ? null : args.toChains.split(',')

    // First let's create the HardhatRuntimeEnvironment objects for all networks
    const getEnvironment = createGetHreByEid()
    const assetConfigs = await getMessagingAssetConfig(getEnvironment)

    const abstractCreditMsging = onAbstract(contract)
    const arbCreditMsging = onArb(contract)
    const auroraCreditMsging = onAurora(contract)
    const avaxCreditMsging = onAvax(contract)
    const baseCreditMsging = onBase(contract)
    const beraCreditMsging = onBera(contract)
    const bscCreditMsging = onBsc(contract)
    const codexCreditMsging = onCodex(contract)
    const coredaoCreditMsging = onCoredao(contract)
    const degenCreditMsging = onDegen(contract)
    const ebiCreditMsging = onEbi(contract)
    const ethCreditMsging = onEth(contract)
    const flareCreditMsging = onFlare(contract)
    const flowCreditMsging = onFlow(contract)
    const fuseCreditMsging = onFuse(contract)
    const glueCreditMsging = onGlue(contract)
    const gnosisCreditMsging = onGnosis(contract)
    const gravityCreditMsging = onGravity(contract)
    const hemiCreditMsging = onHemi(contract)
    const inkCreditMsging = onInk(contract)
    const iotaCreditMsging = onIota(contract)
    const islanderCreditMsging = onIslander(contract)
    const kavaCreditMsging = onKava(contract)
    const klaytnCreditMsging = onKlaytn(contract)
    const lightlinkCreditMsging = onLightlink(contract)
    const mantleCreditMsging = onMantle(contract)
    const metisCreditMsging = onMetis(contract)
    const optCreditMsging = onOpt(contract)
    const peaqCreditMsging = onPeaq(contract)
    const plumeCreditMsging = onPlume(contract)
    const polygonCreditMsging = onPolygon(contract)
    const raribleCreditMsging = onRarible(contract)
    const rootstockCreditMsging = onRootstock(contract)
    const scrollCreditMsging = onScroll(contract)
    const seiCreditMsging = onSei(contract)
    const soneiumCreditMsging = onSoneium(contract)
    const superpositionCreditMsging = onSuperposition(contract)
    const taikoCreditMsging = onTaiko(contract)
    const zkConsensysCreditMsging = onZkConsensys(contract)
    const xchainCreditMsging = onXchain(contract)

    const allContracts = [
        abstractCreditMsging,
        arbCreditMsging,
        auroraCreditMsging,
        avaxCreditMsging,
        baseCreditMsging,
        beraCreditMsging,
        bscCreditMsging,
        codexCreditMsging,
        coredaoCreditMsging,
        degenCreditMsging,
        ebiCreditMsging,
        ethCreditMsging,
        flareCreditMsging,
        flowCreditMsging,
        fuseCreditMsging,
        glueCreditMsging,
        gravityCreditMsging,
        hemiCreditMsging,
        inkCreditMsging,
        iotaCreditMsging,
        islanderCreditMsging,
        kavaCreditMsging,
        klaytnCreditMsging,
        lightlinkCreditMsging,
        mantleCreditMsging,
        metisCreditMsging,
        optCreditMsging,
        peaqCreditMsging,
        plumeCreditMsging,
        polygonCreditMsging,
        raribleCreditMsging,
        rootstockCreditMsging,
        scrollCreditMsging,
        seiCreditMsging,
        soneiumCreditMsging,
        superpositionCreditMsging,
        taikoCreditMsging,
        zkConsensysCreditMsging,
        xchainCreditMsging,
    ]

    const filteredContracts = allContracts.filter(
        (contract) =>
            fromChains === null ||
            (fromChains.includes(endpointIdToChain(contract.eid)) &&
                (toChains === null || toChains.includes(endpointIdToChain(contract.eid))))
    )

    const ravina = {
        contracts: filteredContracts.map((contract) => ({
            contract,
            config: {
                owner: getSafeAddress(contract.eid),
                delegate: getSafeAddress(contract.eid),
                planner: DEFAULT_PLANNER,
                assets: assetConfigs[contract.eid as keyof typeof assetConfigs],
            },
        })),
        connections: generateCreditMessagingConfig(filteredContracts),
    }

    console.log(ravina)

    return ravina
}
