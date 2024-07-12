import '@nomiclabs/hardhat-ethers'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { USDC, createUSDCFactory } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { USDCOmniGraph, configureProxyAdmin, configureUSDC, initializeMinters } from '@stargatefinance/stg-devtools-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { OmniGraphBuilder, OmniPoint } from '@layerzerolabs/devtools'
import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('USDC/configurator', () => {
    // Declaration of variables to be used in the test suite
    let myUSDC: Contract
    let myUSDCProxyDeployment: Contract
    let myUSDCProxy: Contract
    let owner: SignerWithAddress
    let planner: SignerWithAddress
    let initializer: SignerWithAddress
    let lostAndFound: SignerWithAddress
    let tempMasterMinter: SignerWithAddress
    let newMasterMinter: SignerWithAddress
    let newAdmin: SignerWithAddress
    let newMinter: SignerWithAddress
    let newPauser: SignerWithAddress
    let newBlacklister: SignerWithAddress
    let newRescuer: SignerWithAddress

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[
            owner,
            planner,
            initializer,
            lostAndFound,
            tempMasterMinter,
            newMasterMinter,
            newAdmin,
            newMinter,
            newPauser,
            newBlacklister,
            newRescuer,
        ] = await ethers.getSigners()
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
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
        myUSDC = await fiatTokenContractFactory.connect(owner).deploy()

        // Brick its initialization
        await myUSDC.initialize(
            '',
            '',
            '',
            0,
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000001'
        )
        await myUSDC.initializeV2('')
        await myUSDC.initializeV2_1('0x0000000000000000000000000000000000000001')
        await myUSDC.initializeV2_2([], '')

        // Deploying USDC proxy contract based on contract from planner address
        myUSDCProxyDeployment = await (await ethers.getContractFactory('FiatTokenProxy'))
            .connect(planner)
            .deploy(myUSDC.address)

        // impose the impl ABI on the proxy
        myUSDCProxy = new ethers.Contract(myUSDCProxyDeployment.address, fiatTokenAbi)

        await myUSDCProxy
            .connect(initializer)
            .initialize(
                'Bridged USDC (LZ)',
                'USDC.e',
                'USD',
                18,
                tempMasterMinter.address,
                planner.address,
                planner.address,
                owner.address
            )
        await myUSDCProxy.connect(initializer).initializeV2('Bridged USDC (LZ)')
        await myUSDCProxy.connect(initializer).initializeV2_1(lostAndFound.address)
        await myUSDCProxy.connect(initializer).initializeV2_2([], 'USDC.e')
    })

    it('should configure the contract using default configureUSDC', async () => {
        const sdkFactory = createUSDCFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myUSDC.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myUSDCProxyDeployment.address,
        }

        const graph: USDCOmniGraph = new OmniGraphBuilder().addNodes({
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
        }).graph as USDCOmniGraph

        const configTxs = await configureUSDC(graph, sdkFactory)

        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myUSDCProxyDeployment.address })
        expect(await sdk.getMasterMinter()).to.equal(newMasterMinter.address)
        expect(await sdk.getBlacklister()).to.equal(newBlacklister.address)
        expect(await sdk.getPauser()).to.equal(newPauser.address)
        expect(await sdk.getRescuer()).to.equal(newRescuer.address)
    })

    it('should return no Txs when configurations match for configureUSDC', async () => {
        const sdkFactory = (from: OmniPoint) => new USDC({ eid: from.eid, contract: myUSDC.attach(from.address) })

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myUSDCProxyDeployment.address,
        }

        const graph: USDCOmniGraph = new OmniGraphBuilder().addNodes({
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
        }).graph as USDCOmniGraph

        const configTxs = await configureUSDC(graph, sdkFactory)

        for (let i = 0; i < configTxs.length; i++) {
            await owner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureUSDC(graph, sdkFactory)).to.be.empty
    })

    it('should configure the contract using initializeMinters', async () => {
        const sdkFactory = createUSDCFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myUSDC.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myUSDCProxyDeployment.address,
        }

        const graph: USDCOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                minters: {
                    [newMinter.address]: 100n,
                },
            },
        }).graph as USDCOmniGraph

        const configTxs = await initializeMinters(graph, sdkFactory)

        for (let i = 0; i < configTxs.length; i++) {
            await tempMasterMinter.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myUSDCProxyDeployment.address })
        expect(await sdk.getMinterAllowance(newMinter.address)).to.equal(100n)
    })

    it('should return no Txs when configurations match for initializeMinters', async () => {
        const sdkFactory = createUSDCFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myUSDC.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myUSDCProxyDeployment.address,
        }

        const graph: USDCOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                minters: {
                    [newMinter.address]: 100n,
                },
            },
        }).graph as USDCOmniGraph

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
        const sdkFactory = createUSDCFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myUSDCProxyDeployment.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myUSDCProxyDeployment.address,
        }

        const graph: USDCOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                admin: newAdmin.address,
            },
        }).graph as USDCOmniGraph

        const configTxs = await configureProxyAdmin(graph, sdkFactory)

        const sdk = await sdkFactory({ eid: EndpointId.ETHEREUM_V2_SANDBOX, address: myUSDCProxyDeployment.address })
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
        const sdkFactory = createUSDCFactory(({ eid, address }: OmniPoint) => ({
            eid,
            contract: myUSDCProxyDeployment.attach(address),
        }))

        const myPoint: OmniPoint = {
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            address: myUSDCProxyDeployment.address,
        }

        const graph: USDCOmniGraph = new OmniGraphBuilder().addNodes({
            point: myPoint,
            config: {
                admin: newAdmin.address,
            },
        }).graph as USDCOmniGraph

        const configTxs = await configureProxyAdmin(graph, sdkFactory)
        for (let i = 0; i < configTxs.length; i++) {
            await planner.sendTransaction({
                to: configTxs[i].point.address,
                data: configTxs[i].data,
            })
        }

        expect(await configureProxyAdmin(graph, sdkFactory)).to.be.empty
    })
})
