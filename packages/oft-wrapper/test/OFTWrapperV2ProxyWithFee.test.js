const { expect } = require("chai")
const { ethers } = require("hardhat")
const { BigNumber } = require("ethers")

describe("OFTWrapperProxyWithFeeV2:", function () {
    const chainIdSrc = 1
    const chainIdDst = 2
    const sharedDecimals = 6
    const name = "OmnichainFungibleToken"
    const symbol = "OFT"
    const partnerId = "0x0003"
    const tokenFeeBps = 35

    let owner, caller, badUser, feeOwner, OftWrapper, oftWrapper, LZEndpointMock, lzEndpointSrcMock, lzEndpointDstMock
    let OFTV2, OFTProxyV2, MockToken, OFTProxySrc, MockTokenSrc, OFTDst, dstPath, srcPath, BP_DENOMINATOR, MAX_UINT, proxyTokenFeeOwner

    before(async function () {
        ;[owner, caller, badUser, feeOwner] = await ethers.getSigners()

        LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        OftWrapper = await ethers.getContractFactory("OFTWrapper")
        OFTV2 = await ethers.getContractFactory("MockOFTV2")
        OFTProxyV2 = await ethers.getContractFactory("MockOFTProxyWithFeeV2")
        MockToken = await ethers.getContractFactory("MockToken")
    })

    beforeEach(async function () {
        const OftWrapper = await ethers.getContractFactory("OFTWrapper")
        oftWrapper = await OftWrapper.deploy([0])

        lzEndpointSrcMock = await LZEndpointMock.deploy(chainIdSrc)
        lzEndpointDstMock = await LZEndpointMock.deploy(chainIdDst)

        MockTokenSrc = await MockToken.deploy("Test", "test")
        OFTProxySrc = await OFTProxyV2.deploy(MockTokenSrc.address, sharedDecimals, lzEndpointSrcMock.address)
        OFTDst = await OFTV2.deploy(name, symbol, sharedDecimals, lzEndpointDstMock.address)

        // internal bookkeeping for endpoints (not part of a real deploy, just for this test)
        lzEndpointSrcMock.setDestLzEndpoint(OFTDst.address, lzEndpointDstMock.address)
        lzEndpointDstMock.setDestLzEndpoint(OFTProxySrc.address, lzEndpointSrcMock.address)

        BP_DENOMINATOR = await oftWrapper.BPS_DENOMINATOR()
        MAX_UINT = await oftWrapper.MAX_UINT()

        // set the tokenFeeBps
        await OFTProxySrc.setDefaultFeeBp(tokenFeeBps)
        await OFTProxySrc.setFeeOwner(feeOwner.address)

        // set each contracts source address so it can send to each other
        dstPath = ethers.utils.solidityPack(["address", "address"], [OFTDst.address, OFTProxySrc.address])
        srcPath = ethers.utils.solidityPack(["address", "address"], [OFTProxySrc.address, OFTDst.address])
        await OFTProxySrc.setTrustedRemote(chainIdDst, dstPath) // for A, set B
        await OFTDst.setTrustedRemote(chainIdSrc, srcPath) // for B, set A
    })

    it("sendProxyOFTWithFeeV2()", async function () {
        let amountToMint = BigNumber.from("1000000000000000000000000")
        let amountToSwap = BigNumber.from("100000000000000")
        let defaultBps = 1000
        let callerBps = 100
        let feeObj = { callerBps, caller: caller.address, partnerId }
        const bytes32ToAddress = ethers.utils.defaultAbiCoder.encode(["address"], [owner.address])

        await oftWrapper.setDefaultBps(defaultBps)

        await MockTokenSrc.mint(owner.address, amountToMint)

        expect(await MockTokenSrc.balanceOf(owner.address)).to.be.equal(amountToMint)
        expect(await MockTokenSrc.balanceOf(oftWrapper.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(owner.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(caller.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(oftWrapper.address)).to.be.equal(0)

        await MockTokenSrc.approve(oftWrapper.address, amountToSwap)

        const lzFee = (await oftWrapper.estimateSendFeeV2(OFTProxySrc.address, chainIdDst, bytes32ToAddress, amountToSwap, false, "0x", feeObj))
            .nativeFee

        let { amount, wrapperFee, callerFee } = await oftWrapper.getAmountAndFees(MockTokenSrc.address, amountToSwap, callerBps)
        let proxyTokenFee = await OFTProxySrc.quoteOFTFee(chainIdDst, amount)

        let l2ToSdRate = Math.pow(10, (await MockTokenSrc.decimals()) - sharedDecimals);

        let dustAmountAfterOFTFee = amount.sub(proxyTokenFee) % l2ToSdRate

        await oftWrapper.sendProxyOFTFeeV2(
            OFTProxySrc.address,
            chainIdDst,
            bytes32ToAddress,
            amountToSwap,
            0,
            [owner.address, ethers.constants.AddressZero, "0x"],
            feeObj,
            { value: lzFee }
        )

        let expectedAmountToSwapCrossChain = amount.sub(dustAmountAfterOFTFee).sub(proxyTokenFee)

        expect(await MockTokenSrc.balanceOf(owner.address)).to.be.equal(amountToMint.sub(amountToSwap))
        expect(await MockTokenSrc.balanceOf(caller.address)).to.be.equal(callerFee)
        expect(await MockTokenSrc.balanceOf(feeOwner.address)).to.be.equal(proxyTokenFee)
        expect(await MockTokenSrc.balanceOf(oftWrapper.address)).to.be.equal(wrapperFee.add(dustAmountAfterOFTFee))

        expect(await MockTokenSrc.balanceOf(OFTProxySrc.address)).to.be.equal(expectedAmountToSwapCrossChain)
        expect(await OFTDst.balanceOf(owner.address)).to.be.equal(expectedAmountToSwapCrossChain)


        // withdrawing the fees
        await oftWrapper.withdrawFees(MockTokenSrc.address, owner.address, wrapperFee)
        expect(await MockTokenSrc.balanceOf(owner.address)).to.be.equal(amountToMint.sub(amountToSwap).add(wrapperFee))
    })

    it("sendProxyOFTWithFeeV2() reverts - BaseOFTWithFee: amount is less than minAmount", async function () {
        let amountToMint = BigNumber.from("1000000000000000000000000")
        let amountToSwap = BigNumber.from("100000000000000")
        let defaultBps = 1000
        let callerBps = 100
        let feeObj = { callerBps, caller: caller.address, partnerId }
        const bytes32ToAddress = ethers.utils.defaultAbiCoder.encode(["address"], [owner.address])

        await oftWrapper.setDefaultBps(defaultBps)

        await MockTokenSrc.mint(owner.address, amountToMint)

        expect(await MockTokenSrc.balanceOf(owner.address)).to.be.equal(amountToMint)
        expect(await MockTokenSrc.balanceOf(oftWrapper.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(owner.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(caller.address)).to.be.equal(0)
        expect(await OFTDst.balanceOf(oftWrapper.address)).to.be.equal(0)

        await MockTokenSrc.approve(oftWrapper.address, amountToSwap)

        const lzFee = (await oftWrapper.estimateSendFeeV2(OFTProxySrc.address, chainIdDst, bytes32ToAddress, amountToSwap, false, "0x", feeObj))
            .nativeFee

        let { amount } = await oftWrapper.getAmountAndFees(MockTokenSrc.address, amountToSwap, callerBps)
        let proxyTokenFee = await OFTProxySrc.quoteOFTFee(chainIdDst, amount)

        let l2ToSdRate = Math.pow(10, (await MockTokenSrc.decimals()) - sharedDecimals);

        let dustAmountAfterOFTFee = amount.sub(proxyTokenFee) % l2ToSdRate

        let expectedAmountToSwapCrossChain = amount.sub(dustAmountAfterOFTFee).sub(proxyTokenFee)

        await expect(
            oftWrapper.sendProxyOFTFeeV2(
                OFTProxySrc.address,
                chainIdDst,
                bytes32ToAddress,
                amountToSwap,
                expectedAmountToSwapCrossChain.add(1),
                [owner.address, ethers.constants.AddressZero, "0x"],
                feeObj,
                { value: lzFee }
            )
        ).to.be.revertedWith("BaseOFTWithFee: amount is less than minAmount")

        await oftWrapper.sendProxyOFTFeeV2(
            OFTProxySrc.address,
            chainIdDst,
            bytes32ToAddress,
            amountToSwap,
            expectedAmountToSwapCrossChain,
            [owner.address, ethers.constants.AddressZero, "0x"],
            feeObj,
            { value: lzFee }
        )
    })

    it("sendProxyOFTFeeV2() reverts - amount to transfer < min amount", async function () {
        let amountToMint = BigNumber.from("1000000000000000000000000")
        let amountToSwap = BigNumber.from("100000000000000")
        let defaultBps = 1
        let callerBps = 0
        let feeObj = { callerBps, caller: caller.address, partnerId }
        const bytes32ToAddress = ethers.utils.defaultAbiCoder.encode(["address"], [owner.address])

        await oftWrapper.setDefaultBps(defaultBps)
        await MockTokenSrc.mint(owner.address, amountToMint)
        await MockTokenSrc.approve(oftWrapper.address, amountToSwap)


        const lzFee = (await oftWrapper.estimateSendFeeV2(OFTProxySrc.address, chainIdDst, bytes32ToAddress, amountToSwap, false, "0x", feeObj))
            .nativeFee

        let { amount } = await oftWrapper.getAmountAndFees(MockTokenSrc.address, amountToSwap, callerBps)

        expect(amount).to.be.lt(amountToSwap)

        await expect(
            oftWrapper.sendProxyOFTFeeV2(
                OFTProxySrc.address,
                chainIdDst,
                bytes32ToAddress,
                amountToSwap,
                amountToSwap,
                [owner.address, ethers.constants.AddressZero, "0x"],
                feeObj,
                { value: lzFee }
            )
        ).to.be.revertedWith("OFTWrapper: not enough amountToSwap")
    })
})
