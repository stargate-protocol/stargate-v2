import '@nomiclabs/hardhat-ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { USDC } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { EndpointId } from '@layerzerolabs/lz-definitions'

describe('USDC/sdk', () => {
    // Declaration of variables to be used in the test suite
    let myUSDC: Contract
    let myUSDCProxyDeployment: Contract
    let myUSDCProxy: Contract
    let owner: SignerWithAddress
    let planner: SignerWithAddress
    let initializer: SignerWithAddress
    let lostAndFound: SignerWithAddress
    let newMasterMinter: SignerWithAddress
    let newAdmin: SignerWithAddress
    let newMinter: SignerWithAddress
    let newBlacklister: SignerWithAddress
    let newPauser: SignerWithAddress
    let newRescuer: SignerWithAddress
    let usdcSdk: USDC
    let proxyUSDCSdk: USDC
    let token: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        ;[
            owner,
            planner,
            initializer,
            lostAndFound,
            newMasterMinter,
            newAdmin,
            newMinter,
            newBlacklister,
            newPauser,
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
                newMasterMinter.address,
                planner.address,
                planner.address,
                owner.address
            )
        await myUSDCProxy.connect(initializer).initializeV2('Bridged USDC (LZ)')
        await myUSDCProxy.connect(initializer).initializeV2_1(lostAndFound.address)
        await myUSDCProxy.connect(initializer).initializeV2_2([], 'USDC.e')

        usdcSdk = new USDC({
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            contract: myUSDC.attach(myUSDCProxyDeployment.address),
        })

        proxyUSDCSdk = new USDC({
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            contract: myUSDCProxyDeployment,
        })

        token = await (await ethers.getContractFactory('ERC20Token')).deploy('Mock', 'MCK', 6)
    })

    describe('isMinter', () => {
        it('should return false if no minters set', async () => {
            expect(await usdcSdk.isMinter(owner.address)).to.equal(false)
        })
    })

    describe('getMinterAllowance', () => {
        it('should get minter allowance', async () => {
            expect(await usdcSdk.getMinterAllowance(owner.address)).to.equal(0)
        })
    })

    describe('configureMinter', () => {
        it('should configure minter', async () => {
            const tx = await usdcSdk.configureMinter(owner.address, 100n)
            await newMasterMinter.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await usdcSdk.getMinterAllowance(owner.address)).to.equal(100n)
        })
    })

    describe('removeMinter', () => {
        it('should remove minter', async () => {
            const configureMinterTx = await usdcSdk.configureMinter(owner.address, 100n)
            await newMasterMinter.sendTransaction({
                to: configureMinterTx.point.address,
                data: configureMinterTx.data,
            })
            expect(await usdcSdk.getMinterAllowance(owner.address)).to.equal(100n)

            const removeMinterTx = await usdcSdk.removeMinter(owner.address)
            await newMasterMinter.sendTransaction({
                to: removeMinterTx.point.address,
                data: removeMinterTx.data,
            })
            expect(await usdcSdk.getMinterAllowance(owner.address)).to.equal(0)
        })
    })

    describe('getMasterMinter', () => {
        it('should get master minter', async () => {
            expect(await usdcSdk.getMasterMinter()).to.equal(newMasterMinter.address)
        })
    })

    describe('setMasterMinter', () => {
        it('should set Master Minter', async () => {
            const configureMinterTx = await usdcSdk.setMasterMinter(newMinter.address)
            await owner.sendTransaction({
                to: configureMinterTx.point.address,
                data: configureMinterTx.data,
            })
            expect(await usdcSdk.getMasterMinter()).to.equal(newMinter.address)
        })
    })

    describe('getBlacklister', () => {
        it('should get blacklister', async () => {
            expect(await usdcSdk.getBlacklister()).to.equal(planner.address)
        })
    })

    describe('setBlacklister', () => {
        it('should set blacklister', async () => {
            const tx = await usdcSdk.setBlacklister(newBlacklister.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await usdcSdk.getBlacklister()).to.equal(newBlacklister.address)
        })
    })

    describe('isBlacklisted', () => {
        it('should return false if not black listed', async () => {
            expect(await usdcSdk.isBlacklisted(newBlacklister.address)).to.equal(false)
        })
    })

    describe('setBlacklisted', () => {
        it('should set black list address to true', async () => {
            // need to change the proxy admin bc blacklister and proxy admin are the same address
            const setAdminTx = await proxyUSDCSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyUSDCSdk.getAdmin()).to.equal(newAdmin.address)

            const tx = await usdcSdk.setBlacklisted(newBlacklister.address, true)
            await planner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await usdcSdk.isBlacklisted(newBlacklister.address)).to.equal(true)
        })

        it('should set black list address to false', async () => {
            // need to change the proxy admin bc blacklister and proxy admin are the same address
            const setAdminTx = await proxyUSDCSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyUSDCSdk.getAdmin()).to.equal(newAdmin.address)

            const tx = await usdcSdk.setBlacklisted(newBlacklister.address, false)
            await planner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await usdcSdk.isBlacklisted(newBlacklister.address)).to.equal(false)
        })
    })

    describe('getPauser', () => {
        it('should get planner address for pauser', async () => {
            expect(await usdcSdk.getPauser()).to.equal(planner.address)
        })
    })

    describe('setPauser', () => {
        it('should set pauser', async () => {
            const tx = await usdcSdk.setPauser(newPauser.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await usdcSdk.getPauser()).to.equal(newPauser.address)
        })
    })

    describe('isPaused', () => {
        it('should return false if not paused', async () => {
            expect(await usdcSdk.isPaused()).to.equal(false)
        })
    })

    describe('setPaused', () => {
        it('should set paused true', async () => {
            // need to change the proxy admin bc pauser and proxy admin are the same address
            const setAdminTx = await proxyUSDCSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyUSDCSdk.getAdmin()).to.equal(newAdmin.address)

            const setPauserTx = await usdcSdk.setPauser(newPauser.address)
            await owner.sendTransaction({
                to: setPauserTx.point.address,
                data: setPauserTx.data,
            })

            const setPausedTx = await usdcSdk.setPaused(true)
            await newPauser.sendTransaction({
                to: setPausedTx.point.address,
                data: setPausedTx.data,
            })

            expect(await usdcSdk.isPaused()).to.equal(true)
        })

        it('should set paused false', async () => {
            // need to change the proxy admin bc pauser and proxy admin are the same address
            const setAdminTx = await proxyUSDCSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyUSDCSdk.getAdmin()).to.equal(newAdmin.address)

            const setPauserTx = await usdcSdk.setPauser(newPauser.address)
            await owner.sendTransaction({
                to: setPauserTx.point.address,
                data: setPauserTx.data,
            })

            const setPausedTx = await usdcSdk.setPaused(false)
            await newPauser.sendTransaction({
                to: setPausedTx.point.address,
                data: setPausedTx.data,
            })

            expect(await usdcSdk.isPaused()).to.equal(false)
        })
    })

    describe('getRescuer', () => {
        it('should get 0x0 address for rescuer because it was not set', async () => {
            expect(await usdcSdk.getRescuer()).to.equal('0x0000000000000000000000000000000000000000')
        })
    })

    describe('setRescuer', () => {
        it('should set rescuer', async () => {
            const tx = await usdcSdk.setRescuer(newRescuer.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await usdcSdk.getRescuer()).to.equal(newRescuer.address)
        })
    })

    describe('rescueERC20', () => {
        it('should rescue an ERC20', async () => {
            await token.mint(myUSDCProxyDeployment.address, ethers.utils.parseEther('1'))
            expect(await token.balanceOf(myUSDCProxyDeployment.address)).to.equal(ethers.utils.parseEther('1'))
            expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('10000'))

            const setRescuerTx = await usdcSdk.setRescuer(owner.address)
            await owner.sendTransaction({
                to: setRescuerTx.point.address,
                data: setRescuerTx.data,
            })

            const rescueERC20Tx = await usdcSdk.rescueERC20(
                token.address,
                owner.address,
                ethers.utils.parseEther('1').toBigInt()
            )
            await owner.sendTransaction({
                to: rescueERC20Tx.point.address,
                data: rescueERC20Tx.data,
            })

            expect(await token.balanceOf(myUSDCProxyDeployment.address)).to.equal(0)
            expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('10001'))
        })
    })

    describe('getAdmin', () => {
        it('should return admin', async () => {
            expect(await proxyUSDCSdk.getAdmin()).to.equal(planner.address)
        })
    })

    describe('setAdmin', () => {
        it('should set admin to newAdmin', async () => {
            const tx = await proxyUSDCSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await proxyUSDCSdk.getAdmin()).to.equal(newAdmin.address)
        })
    })
})
