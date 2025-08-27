import '@nomiclabs/hardhat-ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CircleFiatToken } from '@stargatefinance/stg-devtools-evm-hardhat-v2'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

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

describe('USDC/sdk', () => {
    describe('USDC/sdk', () => {
        testCircleFiatTokenSDK('USDC', 'USDC.e', 18, 'USD')
    })

    describe('EURC/sdk', () => {
        testCircleFiatTokenSDK('EURC', 'EURC.e', 18, 'EUR')
    })
})

function testCircleFiatTokenSDK(
    tokenName: string,
    tokenSymbol: string,
    tokenDecimals: number,
    stringTokenCoin: string
) {
    let myToken: Contract
    let myTokenProxyDeployment: Contract
    let myTokenProxy: Contract
    let signers: Signers
    let tokenSdk: CircleFiatToken
    let proxyTokenSdk: CircleFiatToken
    let token: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async () => {
        const accounts = await ethers.getSigners()
        signers = Object.fromEntries(roles.map((role, i) => [role, accounts[i]])) as Signers
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async () => {
        const { owner, planner, initializer, lostAndFound, newMasterMinter } = signers

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
                newMasterMinter.address,
                planner.address,
                planner.address,
                owner.address
            )
        await myTokenProxy.connect(initializer).initializeV2(tokenName)
        await myTokenProxy.connect(initializer).initializeV2_1(lostAndFound.address)
        await myTokenProxy.connect(initializer).initializeV2_2([], tokenSymbol)

        tokenSdk = new CircleFiatToken({
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            contract: myToken.attach(myTokenProxyDeployment.address),
        })

        proxyTokenSdk = new CircleFiatToken({
            eid: EndpointId.ETHEREUM_V2_SANDBOX,
            contract: myTokenProxyDeployment,
        })

        token = await (await ethers.getContractFactory('ERC20Token')).deploy('Mock', 'MCK', 6)
    })

    describe('isMinter', () => {
        it('should return false if no minters set', async () => {
            const { owner } = signers

            expect(await tokenSdk.isMinter(owner.address)).to.equal(false)
        })
    })

    describe('getMinterAllowance', () => {
        it('should get minter allowance', async () => {
            const { owner } = signers

            expect(await tokenSdk.getMinterAllowance(owner.address)).to.equal(0)
        })
    })

    describe('configureMinter', () => {
        it('should configure minter', async () => {
            const { owner, newMasterMinter } = signers

            const tx = await tokenSdk.configureMinter(owner.address, 100n)
            await newMasterMinter.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await tokenSdk.getMinterAllowance(owner.address)).to.equal(100n)
        })
    })

    describe('removeMinter', () => {
        it('should remove minter', async () => {
            const { owner, newMasterMinter } = signers

            const configureMinterTx = await tokenSdk.configureMinter(owner.address, 100n)
            await newMasterMinter.sendTransaction({
                to: configureMinterTx.point.address,
                data: configureMinterTx.data,
            })
            expect(await tokenSdk.getMinterAllowance(owner.address)).to.equal(100n)

            const removeMinterTx = await tokenSdk.removeMinter(owner.address)
            await newMasterMinter.sendTransaction({
                to: removeMinterTx.point.address,
                data: removeMinterTx.data,
            })
            expect(await tokenSdk.getMinterAllowance(owner.address)).to.equal(0)
        })
    })

    describe('getMasterMinter', () => {
        it('should get master minter', async () => {
            const { newMasterMinter } = signers

            expect(await tokenSdk.getMasterMinter()).to.equal(newMasterMinter.address)
        })
    })

    describe('setMasterMinter', () => {
        it('should set Master Minter', async () => {
            const { owner, newMinter } = signers

            const configureMinterTx = await tokenSdk.setMasterMinter(newMinter.address)
            await owner.sendTransaction({
                to: configureMinterTx.point.address,
                data: configureMinterTx.data,
            })
            expect(await tokenSdk.getMasterMinter()).to.equal(newMinter.address)
        })
    })

    describe('getBlacklister', () => {
        it('should get blacklister', async () => {
            const { planner } = signers

            expect(await tokenSdk.getBlacklister()).to.equal(planner.address)
        })
    })

    describe('setBlacklister', () => {
        it('should set blacklister', async () => {
            const { owner, newBlacklister } = signers

            const tx = await tokenSdk.setBlacklister(newBlacklister.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await tokenSdk.getBlacklister()).to.equal(newBlacklister.address)
        })
    })

    describe('isBlacklisted', () => {
        it('should return false if not black listed', async () => {
            const { newBlacklister } = signers

            expect(await tokenSdk.isBlacklisted(newBlacklister.address)).to.equal(false)
        })
    })

    describe('setBlacklisted', () => {
        it('should set black list address to true', async () => {
            const { newAdmin, planner, newBlacklister } = signers

            // need to change the proxy admin bc blacklister and proxy admin are the same address
            const setAdminTx = await proxyTokenSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyTokenSdk.getAdmin()).to.equal(newAdmin.address)

            const tx = await tokenSdk.setBlacklisted(newBlacklister.address, true)
            await planner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await tokenSdk.isBlacklisted(newBlacklister.address)).to.equal(true)
        })

        it('should set black list address to false', async () => {
            const { newAdmin, planner, newBlacklister } = signers

            // need to change the proxy admin bc blacklister and proxy admin are the same address
            const setAdminTx = await proxyTokenSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyTokenSdk.getAdmin()).to.equal(newAdmin.address)

            const tx = await tokenSdk.setBlacklisted(newBlacklister.address, false)
            await planner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await tokenSdk.isBlacklisted(newBlacklister.address)).to.equal(false)
        })
    })

    describe('getPauser', () => {
        it('should get planner address for pauser', async () => {
            const { planner } = signers

            expect(await tokenSdk.getPauser()).to.equal(planner.address)
        })
    })

    describe('setPauser', () => {
        it('should set pauser', async () => {
            const { owner, newPauser } = signers

            const tx = await tokenSdk.setPauser(newPauser.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await tokenSdk.getPauser()).to.equal(newPauser.address)
        })
    })

    describe('isPaused', () => {
        it('should return false if not paused', async () => {
            expect(await tokenSdk.isPaused()).to.equal(false)
        })
    })

    describe('setPaused', () => {
        it('should set paused true', async () => {
            const { newAdmin, planner, newPauser, owner } = signers

            // need to change the proxy admin bc pauser and proxy admin are the same address
            const setAdminTx = await proxyTokenSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyTokenSdk.getAdmin()).to.equal(newAdmin.address)

            const setPauserTx = await tokenSdk.setPauser(newPauser.address)
            await owner.sendTransaction({
                to: setPauserTx.point.address,
                data: setPauserTx.data,
            })

            const setPausedTx = await tokenSdk.setPaused(true)
            await newPauser.sendTransaction({
                to: setPausedTx.point.address,
                data: setPausedTx.data,
            })

            expect(await tokenSdk.isPaused()).to.equal(true)
        })

        it('should set paused false', async () => {
            const { newAdmin, planner, newPauser, owner } = signers

            // need to change the proxy admin bc pauser and proxy admin are the same address
            const setAdminTx = await proxyTokenSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: setAdminTx.point.address,
                data: setAdminTx.data,
            })
            expect(await proxyTokenSdk.getAdmin()).to.equal(newAdmin.address)

            const setPauserTx = await tokenSdk.setPauser(newPauser.address)
            await owner.sendTransaction({
                to: setPauserTx.point.address,
                data: setPauserTx.data,
            })

            const setPausedTx = await tokenSdk.setPaused(false)
            await newPauser.sendTransaction({
                to: setPausedTx.point.address,
                data: setPausedTx.data,
            })

            expect(await tokenSdk.isPaused()).to.equal(false)
        })
    })

    describe('getRescuer', () => {
        it('should get 0x0 address for rescuer because it was not set', async () => {
            expect(await tokenSdk.getRescuer()).to.equal('0x0000000000000000000000000000000000000000')
        })
    })

    describe('setRescuer', () => {
        it('should set rescuer', async () => {
            const { owner, newRescuer } = signers

            const tx = await tokenSdk.setRescuer(newRescuer.address)
            await owner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await tokenSdk.getRescuer()).to.equal(newRescuer.address)
        })
    })

    describe('rescueERC20', () => {
        it('should rescue an ERC20', async () => {
            const { owner } = signers

            await token.mint(myTokenProxyDeployment.address, ethers.utils.parseEther('1'))
            expect(await token.balanceOf(myTokenProxyDeployment.address)).to.equal(ethers.utils.parseEther('1'))
            expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('10000'))

            const setRescuerTx = await tokenSdk.setRescuer(owner.address)
            await owner.sendTransaction({
                to: setRescuerTx.point.address,
                data: setRescuerTx.data,
            })

            const rescueERC20Tx = await tokenSdk.rescueERC20(
                token.address,
                owner.address,
                ethers.utils.parseEther('1').toBigInt()
            )
            await owner.sendTransaction({
                to: rescueERC20Tx.point.address,
                data: rescueERC20Tx.data,
            })

            expect(await token.balanceOf(myTokenProxyDeployment.address)).to.equal(0)
            expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('10001'))
        })
    })

    describe('getAdmin', () => {
        it('should return admin', async () => {
            const { planner } = signers

            expect(await proxyTokenSdk.getAdmin()).to.equal(planner.address)
        })
    })

    describe('setAdmin', () => {
        it('should set admin to newAdmin', async () => {
            const { newAdmin, planner } = signers

            const tx = await proxyTokenSdk.setAdmin(newAdmin.address)
            await planner.sendTransaction({
                to: tx.point.address,
                data: tx.data,
            })
            expect(await proxyTokenSdk.getAdmin()).to.equal(newAdmin.address)
        })
    })
}
