import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CircleFiatToken, createCircleFiatTokenFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import {
    CircleFiatTokenOmniGraph,
    configureCircleFiatToken,
    configureProxyAdmin,
    initializeMinters,
} from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

const roles = [
    'owner',
    'planner',
    'initializer',
    'lostAndFound',
    'tempMasterMinter',
    'newMasterMinter',
    'newAdmin',
    'newMinter',
    'newPauser',
    'newBlacklister',
    'newRescuer',
] as const

type SignerRole = (typeof roles)[number]
type Signers = Record<SignerRole, SignerWithAddress>

describe('CircleFiatToken/configurator', () => {
    describe('USDC/configurator', async () => {
        testCircleFiatTokenConfigurator('USDC', 'USDC.e', 18, 'USD')
    })

    describe('EURC/configurator', () => {
        testCircleFiatTokenConfigurator('EURC', 'EURC.e', 18, 'EUR')
    })
})

function testCircleFiatTokenConfigurator(
    tokenName: string,
    tokenSymbol: string,
    tokenDecimals: number,
    stringTokenCoin: string
) {
    let myToken: Contract
    let myTokenProxyDeployment: Contract
    let myTokenProxy: Contract
    let signers: Signers

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        const accounts = await ethers.getSigners()
        signers = Object.fromEntries(roles.map((role, i) => [role, accounts[i]])) as Signers
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        const { owner, planner, initializer, lostAndFound, tempMasterMinter } = signers

        const SignatureChecker = await ethers.getContractFactory('SignatureChecker')
        const signatureChecker = await SignatureChecker.deploy()
        await signatureChecker.deployed()

        const fiatTokenContractFactory = await ethers.getContractFactory('FiatTokenV2_2', {
            libraries: {
                SignatureChecker: signatureChecker.address,
            },
        })

        // get FiatTokenV2_2 abi
        const fiatTokenAbi = fiatTokenContractFactory.interface.format(ethers.utils.FormatTypes.json)

        // Deploying an instance of the USDC contract
        myToken = await fiatTokenContractFactory.connect(owner).deploy()

        // Brick its initialization
        await myToken.initialize(
            '',
            '',
            '',
            0,
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000001'
        )
        await myToken.initializeV2('')
        await myToken.initializeV2_1('0x0000000000000000000000000000000000000001')
        await myToken.initializeV2_2([], '')

        // Deploying USDC proxy contract based on contract from planner address
        myTokenProxyDeployment = await (await ethers.getContractFactory('FiatTokenProxy'))
            .connect(planner)
            .deploy(myToken.address)

        // impose the impl ABI on the proxy
        myTokenProxy = new ethers.Contract(myTokenProxyDeployment.address, fiatTokenAbi)

        await myTokenProxy
            .connect(initializer)
            .initialize(
                tokenName,
                tokenSymbol,
                stringTokenCoin,
                tokenDecimals,
                tempMasterMinter.address,
                planner.address,
                planner.address,
                owner.address
            )
        await myTokenProxy.connect(initializer).initializeV2(tokenName)
        await myTokenProxy.connect(initializer).initializeV2_1(lostAndFound.address)
        await myTokenProxy.connect(initializer).initializeV2_2([], tokenSymbol)
    })

    it('should configure the contract using default configureUSDC', async () => {
        const { owner, newMasterMinter, newBlacklister, newPauser, newRescuer } = signers

        const sdkFactory = createCircleFiatTokenFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myToken.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenProxyDeployment.address,
        }

        const graph: CircleFiatTokenOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                // USDC contract configuration
                masterMinter: newMasterMinter.address,
                // Blacklistable contract configuration
                blacklister: newBlacklister.address,
                // Pausable contract configuration
                pauser: newPauser.address,
                // Rescuable contract configuration
                rescuer: newRescuer.address,
            },
        }).graph as CircleFiatTokenOmniGraph

        const configTxs = await configureCircleFiatToken(graph, sdkFactory)

        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myTokenProxyDeployment.address })
        expect(await sdk.getMasterMinter()).to.equal(newMasterMinter.address)
        expect(await sdk.getBlacklister()).to.equal(newBlacklister.address)
        expect(await sdk.getPauser()).to.equal(newPauser.address)
        expect(await sdk.getRescuer()).to.equal(newRescuer.address)
    })

    it('should return no Txs when configurations match for configureUSDC', async () => {
        const { owner, newMasterMinter, newBlacklister, newPauser, newRescuer } = signers

        const sdkFactory = (from: OmniPoint) =>
            new CircleFiatToken({ eid: from.eid, contract: myToken.attach(from.address) })

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenProxyDeployment.address,
        }

        const graph: CircleFiatTokenOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                // USDC contract configuration
                masterMinter: newMasterMinter.address,
                // Blacklistable contract configuration
                blacklister: newBlacklister.address,
                // Pausable contract configuration
                pauser: newPauser.address,
                // Rescuable contract configuration
                rescuer: newRescuer.address,
            },
        }).graph as CircleFiatTokenOmniGraph

        const configTxs = await configureCircleFiatToken(graph, sdkFactory)

        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureCircleFiatToken(graph, sdkFactory)).to.be.empty
    })

    it('should configure the contract using initializeMinters', async () => {
        const { owner, newMinter, tempMasterMinter } = signers

        const sdkFactory = createCircleFiatTokenFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myToken.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenProxyDeployment.address,
        }

        const graph: CircleFiatTokenOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                minters: {
                    [newMinter.address]: 100n,
                },
            },
        }).graph as CircleFiatTokenOmniGraph

        const configTxs = await initializeMinters(graph, sdkFactory)

        for (let i = 0; i < configTxs.length; i++) {
            await tempMasterMinter.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myTokenProxyDeployment.address })
        expect(await sdk.getMinterAllowance(newMinter.address)).to.equal(100n)
    })

    it('should return no Txs when configurations match for initializeMinters', async () => {
        const { owner, newMinter, tempMasterMinter } = signers

        const sdkFactory = createCircleFiatTokenFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myToken.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenProxyDeployment.address,
        }

        const graph: CircleFiatTokenOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                minters: {
                    [newMinter.address]: 100n,
                },
            },
        }).graph as CircleFiatTokenOmniGraph

        const configTxs = await initializeMinters(graph, sdkFactory)

        for (let i = 0; i < configTxs.length; i++) {
            await tempMasterMinter.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await initializeMinters(graph, sdkFactory)).to.be.empty
    })

    it('should configure the contract using configureProxyAdmin', async () => {
        const { newAdmin, planner } = signers

        const sdkFactory = createCircleFiatTokenFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myTokenProxyDeployment.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenProxyDeployment.address,
        }

        const graph: CircleFiatTokenOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                admin: newAdmin.address,
            },
        }).graph as CircleFiatTokenOmniGraph

        const configTxs = await configureProxyAdmin(graph, sdkFactory)

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myTokenProxyDeployment.address })
        expect(await sdk.getAdmin()).to.equal(planner.address)

        for (let i = 0; i < configTxs.length; i++) {
            await planner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }
        expect(await sdk.getAdmin()).to.equal(newAdmin.address)
    })

    it('should return no Txs when configurations match for configureProxyAdmin', async () => {
        const { newAdmin, planner } = signers

        const sdkFactory = createCircleFiatTokenFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myTokenProxyDeployment.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myTokenProxyDeployment.address,
        }

        const graph: CircleFiatTokenOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                admin: newAdmin.address,
            },
        }).graph as CircleFiatTokenOmniGraph

        const configTxs = await configureProxyAdmin(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await planner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureProxyAdmin(graph, sdkFactory)).to.be.empty
    })
}
