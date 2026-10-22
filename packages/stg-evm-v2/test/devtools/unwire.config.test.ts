import { expect } from 'chai'
import sinon from 'sinon'

import { EndpointId } from '@layerzerolabs/lz-definitions'
import { getDeployedContractAddress } from '@layerzerolabs/lz-evm-sdk-v2'

import { buildMessagingUnwireGraphMainnet, setMainnetStage } from '../../devtools/config/mainnet/utils'
import { generateTokenMessagingConfig } from '../../devtools/config/utils'
import * as shared from '../../devtools/config/utils/shared'
import { loadMessagingUnwireConfig, resolveDeprecatedPeers } from '../../devtools/config/utils/unwire.config.utils'
import {
    __resetUtilsConfigStateForTests,
    getChainsThatSupportMessaging,
} from '../../devtools/config/utils/utils.config'

import type { Chain } from '../../devtools/config/utils'

const BATCH = ['metis-mainnet', 'gravity-mainnet', 'goat-mainnet', 'camp-mainnet']

const makeChain = (name: string, overrides: Partial<Chain> = {}): Chain => ({
    name,
    eid: name,
    token_messaging: true,
    credit_messaging: true,
    ...overrides,
})

describe('devtools/unwire.config', () => {
    const originalUnwireChain = process.env.UNWIRE_CHAIN

    beforeEach(() => {
        __resetUtilsConfigStateForTests()
        setMainnetStage()
    })

    afterEach(() => {
        sinon.restore()
        if (originalUnwireChain === undefined) {
            delete process.env.UNWIRE_CHAIN
        } else {
            process.env.UNWIRE_CHAIN = originalUnwireChain
        }
    })

    describe('resolveDeprecatedPeers', () => {
        const chain = makeChain('chain-a', { status: 'DEPRECATED' as Chain['status'] })
        const deprecatedB = makeChain('chain-b', { status: 'DEPRECATED' as Chain['status'] })
        const activeC = makeChain('chain-c')
        const shutdownD = makeChain('chain-d', {
            status: 'DEPRECATED' as Chain['status'],
            unwire: { chain_shutdown: true },
        })
        const creditOnlyE = makeChain('chain-e', {
            status: 'DEPRECATED' as Chain['status'],
            token_messaging: false,
        })
        const resolvable = [chain, deprecatedB, activeC, shutdownD, creditOnlyE]

        it('returns no peers when deprecated_peers is empty', () => {
            expect(resolveDeprecatedPeers(chain, [], ['chain-a'], resolvable, 'token_messaging', 'label')).to.eql([])
        })

        it('resolves listed deprecated chains', () => {
            expect(
                resolveDeprecatedPeers(chain, ['chain-b'], ['chain-a'], resolvable, 'token_messaging', 'label')
            ).to.eql([deprecatedB])
        })

        it('rejects unknown chains', () => {
            expect(() =>
                resolveDeprecatedPeers(chain, ['chain-x'], ['chain-a'], resolvable, 'token_messaging', 'label')
            ).to.throw(/Invalid deprecated_peers entry "chain-x"/)
        })

        it('rejects the unwire chain itself', () => {
            expect(() =>
                resolveDeprecatedPeers(chain, ['chain-a'], [], resolvable, 'token_messaging', 'label')
            ).to.throw(/must not include the unwire chain itself/)
        })

        it('rejects active chains, which are already peers', () => {
            expect(() =>
                resolveDeprecatedPeers(chain, ['chain-c'], ['chain-a'], resolvable, 'token_messaging', 'label')
            ).to.throw(/is not DEPRECATED/)
        })

        it('rejects chains that are also in allowed_peers', () => {
            expect(() =>
                resolveDeprecatedPeers(
                    chain,
                    ['chain-b'],
                    ['chain-a', 'chain-b'],
                    resolvable,
                    'token_messaging',
                    'label'
                )
            ).to.throw(/cannot be in both allowed_peers and deprecated_peers/)
        })

        it('rejects chains with chain_shutdown', () => {
            expect(() =>
                resolveDeprecatedPeers(chain, ['chain-d'], ['chain-a'], resolvable, 'token_messaging', 'label')
            ).to.throw(/has chain_shutdown: true/)
        })

        it('rejects chains that do not support the unwired contract', () => {
            expect(() =>
                resolveDeprecatedPeers(chain, ['chain-e'], ['chain-a'], resolvable, 'token_messaging', 'label')
            ).to.throw(/does not support token_messaging/)
            expect(
                resolveDeprecatedPeers(chain, ['chain-e'], ['chain-a'], resolvable, 'credit_messaging', 'label')
            ).to.eql([creditOnlyE])
        })

        it('rejects duplicate entries', () => {
            expect(() =>
                resolveDeprecatedPeers(
                    chain,
                    ['chain-b', 'chain-b'],
                    ['chain-a'],
                    resolvable,
                    'token_messaging',
                    'label'
                )
            ).to.throw(/duplicate entries/)
        })
    })

    describe('loadMessagingUnwireConfig (mainnet config)', () => {
        for (const chainName of BATCH) {
            it(`${chainName} peers are all active messaging chains plus the rest of the batch`, () => {
                process.env.UNWIRE_CHAIN = chainName
                const { peerChains } = loadMessagingUnwireConfig('TokenMessaging')
                const peerNames = peerChains.map((peer) => peer.name)

                const activeNames = getChainsThatSupportMessaging().map((peer) => peer.name)
                const batchPeers = BATCH.filter((name) => name !== chainName)
                expect(peerNames).to.have.members([...activeNames, ...batchPeers])
                expect(new Set(peerNames).size).to.equal(peerNames.length)
            })
        }

        it('does not pull in other deprecated chains (e.g. aurora, botanix)', () => {
            process.env.UNWIRE_CHAIN = 'metis-mainnet'
            const peerNames = loadMessagingUnwireConfig('TokenMessaging').peerChains.map((peer) => peer.name)
            expect(peerNames).to.not.include('aurora-mainnet')
            expect(peerNames).to.not.include('botanix-mainnet')
        })
    })

    describe('buildMessagingUnwireGraphMainnet (mainnet config)', () => {
        // Union of disabled edges across the batch unwire runs, as "from->to" chain names.
        const buildBatchDisabledEdges = async () => {
            sinon.stub(shared, 'getAssetsConfig').resolves({})
            const nameByEid = new Map<EndpointId, string>()
            const disabled = new Map<string, unknown>()

            for (const chainName of BATCH) {
                process.env.UNWIRE_CHAIN = chainName
                const { allChains } = loadMessagingUnwireConfig('TokenMessaging')
                allChains.forEach((chain) => nameByEid.set(chain.eid, chain.name))

                const graph = await buildMessagingUnwireGraphMainnet(
                    { contractName: 'TokenMessaging' },
                    generateTokenMessagingConfig
                )
                graph.connections.forEach((edge) => {
                    disabled.set(`${nameByEid.get(edge.from.eid)}->${nameByEid.get(edge.to.eid)}`, edge.config)
                })
            }
            return disabled
        }

        it('disables the nine routes between batch chains and keeps exits into Metis', async () => {
            const disabled = await buildBatchDisabledEdges()
            const batchEdges = [...disabled.keys()].filter((key) => {
                const [from, to] = key.split('->')
                return BATCH.includes(from) && BATCH.includes(to)
            })

            expect(batchEdges).to.have.members([
                'metis-mainnet->gravity-mainnet',
                'metis-mainnet->goat-mainnet',
                'metis-mainnet->camp-mainnet',
                'gravity-mainnet->goat-mainnet',
                'gravity-mainnet->camp-mainnet',
                'goat-mainnet->gravity-mainnet',
                'goat-mainnet->camp-mainnet',
                'camp-mainnet->gravity-mainnet',
                'camp-mainnet->goat-mainnet',
            ])
        })

        it('routes batch edges through the sending chain DeadDVN, send side only', async () => {
            const disabled = await buildBatchDisabledEdges()
            let checked = 0
            for (const [key, config] of disabled) {
                const [from, to] = key.split('->')
                if (!BATCH.includes(from) || !BATCH.includes(to)) continue

                const edgeConfig = config as {
                    sendConfig: { ulnConfig: { requiredDVNs: string[] } }
                    receiveConfig?: unknown
                }
                expect(edgeConfig.sendConfig.ulnConfig.requiredDVNs, key).to.eql([
                    getDeployedContractAddress(from, 'DeadDVN'),
                ])
                // from/to unwires only change the send side; receive config and peers stay untouched.
                expect(edgeConfig.receiveConfig, key).to.be.undefined
                checked++
            }
            expect(checked).to.equal(9)
        })

        it('still disables every active chain route for each batch chain', async () => {
            const disabled = await buildBatchDisabledEdges()
            const activeNames = getChainsThatSupportMessaging().map((chain) => chain.name)

            for (const active of activeNames) {
                expect(disabled.has(`metis-mainnet->${active}`), `metis-mainnet->${active}`).to.be.true
                for (const hydra of ['gravity-mainnet', 'goat-mainnet', 'camp-mainnet']) {
                    expect(disabled.has(`${active}->${hydra}`), `${active}->${hydra}`).to.be.true
                }
            }
        })
    })
})
