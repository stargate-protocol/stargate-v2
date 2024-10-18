/* eslint-disable no-undef */
require('@nomicfoundation/hardhat-chai-matchers');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers, BigNumber } = require('ethers');

const signPermit = require('./helpers/signPermit');

const _1e18 = BigNumber.from('1000000000000000000');

describe('TetherToken', async () => {
    async function deployFreshTether() {
        const TetherToken = await ethers.getContractFactory('TetherTokenV2');
        const token = await upgrades.deployProxy(TetherToken, ['GreatBritishTether', 'GBPT', 6], {
            unsafeAllow: ['constructor'],
        });

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount, thirdAccount] = await ethers.getSigners();

        await token.mint(await otherAccount.getAddress(), _1e18.mul(BigNumber.from(50)));

        return { token, owner, otherAccount, thirdAccount };
    }

    describe('Deployment', async () => {
        it('Should initialize correctly', async () => {
            const { token, owner } = await loadFixture(deployFreshTether);

            const decimals = await token.decimals();
            const name = await token.name();
            const symbol = await token.symbol();

            expect(decimals).to.equal(6);
            expect(name).to.equal('GreatBritishTether');
            expect(symbol).to.equal('GBPT');
            expect(await token.owner()).to.equal(await owner.getAddress());
        });
    });

    describe('Mint & Transfer', async () => {
        it('mint: tokens can be minted to a chosen address', async () => {
            const { token, owner, thirdAccount } = await loadFixture(deployFreshTether);
            const addressToMintTo = await thirdAccount.getAddress();
            await token.mint(addressToMintTo, _1e18.mul(BigNumber.from(50)));
            const balance = await token.balanceOf(addressToMintTo);
            expect(balance.toString()).to.equal(_1e18.mul(BigNumber.from(50)).toString());
        });

        it('redeem: tokens can be burned from the owner address', async () => {
            const { token, owner } = await loadFixture(deployFreshTether);
            const addressToMintTo = await owner.getAddress();
            await token.mint(addressToMintTo, _1e18.mul(BigNumber.from(50)));
            const balanceInitial = await token.balanceOf(addressToMintTo);
            expect(balanceInitial.toString()).to.equal(_1e18.mul(BigNumber.from(50)).toString());
            await token.redeem(_1e18.mul(BigNumber.from(50)));
            const balanceAfter = await token.balanceOf(addressToMintTo);
            expect(balanceAfter).to.equal('0');
        });

        it('multiTransfer: tokens can be transfered to multiple addresses to save gas', async () => {
            const { token, owner, otherAccount, thirdAccount } = await loadFixture(deployFreshTether);

            await token
                .connect(otherAccount)
                .multiTransfer([owner.getAddress(), thirdAccount.getAddress()], [200, 300]);
            const balance1 = await token.balanceOf(owner.getAddress());
            const balance2 = await token.balanceOf(thirdAccount.getAddress());
            expect(balance1.toString()).to.equal('200');
            expect(balance2.toString()).to.equal('300');
        });

        it('multiTransfer: throws error if array lengths do not match', async () => {
            const { token, owner, otherAccount, thirdAccount } = await loadFixture(deployFreshTether);

            const tx = token
                .connect(otherAccount)
                .multiTransfer([owner.getAddress(), thirdAccount.getAddress()], [200]);

            await expect(tx).to.be.revertedWith('TetherToken: multiTransfer mismatch');
        });

        it('transferFrom: should not be possible to transfer to token contract address or if sender is blocked', async () => {
            const { token, owner, otherAccount, thirdAccount } = await loadFixture(deployFreshTether);

            await token.connect(otherAccount).approve(thirdAccount.getAddress(), 100000);
            await expect(
                token.connect(thirdAccount).transferFrom(otherAccount.getAddress(), token.address, 50000)
            ).to.be.revertedWith('ERC20: transfer to the contract address');

            await token.connect(owner).addToBlockedList(otherAccount.getAddress());
            await expect(
                token.connect(thirdAccount).transferFrom(otherAccount.getAddress(), thirdAccount.getAddress(), 50000)
            ).to.be.reverted;
        });

        it('transferFrom: should be possible to transfer with permit signature', async () => {
            const { token, owner, otherAccount } = await loadFixture(deployFreshTether);

            const currentBlock = await ethers.provider.getBlock('latest');
            const { chainId } = await ethers.provider.getNetwork();
            const amount = 50000;
            const deadline = currentBlock.timestamp + 1000;
            const { v, r, s } = await signPermit({
                account: otherAccount,
                spender: await owner.getAddress(),
                tokenName: 'GreatBritishTether',
                tokenAddress: token.address,
                amount: amount.toString(),
                deadline,
                chainId,
                // Default Openzeppelin constructor for ERC20Permit sets version to '1' for tokenWithPermit
                version: '1',
            });

            await token
                .connect(owner)
                [
                    'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'
                ](otherAccount.getAddress(), owner.getAddress(), amount, deadline, v, r, s);

            await token.connect(owner).transferFrom(otherAccount.getAddress(), owner.getAddress(), amount);
        });

        it('transferFrom: should be possible to transfer with permit encoded signature', async () => {
            const { token, owner, otherAccount } = await loadFixture(deployFreshTether);

            const currentBlock = await ethers.provider.getBlock('latest');
            const { chainId } = await ethers.provider.getNetwork();
            const amount = 50000;
            const deadline = currentBlock.timestamp + 1000;
            const { v, r, s } = await signPermit({
                account: otherAccount,
                spender: await owner.getAddress(),
                tokenName: 'GreatBritishTether',
                tokenAddress: token.address,
                amount: amount.toString(),
                deadline,
                chainId,
                // Default Openzeppelin constructor for ERC20Permit sets version to '1' for tokenWithPermit
                version: '1',
            });

            const data = ethers.utils.solidityPack(['bytes32', 'bytes32', 'uint8'], [r, s, v]);

            await token
                .connect(owner)
                [
                    'permit(address,address,uint256,uint256,bytes)'
                ](otherAccount.getAddress(), owner.getAddress(), amount, deadline, data);

            await token.connect(owner).transferFrom(otherAccount.getAddress(), owner.getAddress(), amount);
        });

        it('withBlockedList: user cannot transfer whilst on the blocked list but can again once removed', async () => {
            const { token, owner, otherAccount, thirdAccount } = await loadFixture(deployFreshTether);

            await token.connect(owner).addToBlockedList(otherAccount.getAddress());
            await expect(token.connect(otherAccount).transfer(thirdAccount.getAddress(), _1e18.mul(BigNumber.from(50))))
                .to.be.reverted;

            await token.connect(owner).removeFromBlockedList(otherAccount.getAddress());
            await token.connect(otherAccount).transfer(thirdAccount.getAddress(), _1e18.mul(BigNumber.from(50)));
            const balance = await token.balanceOf(thirdAccount.getAddress());
            await expect(balance.toString()).to.equal(_1e18.mul(BigNumber.from(50)).toString());
        });

        it('destroyBlockedFunds: funds that are blocked can be destroyed by owner', async () => {
            const { token, owner, otherAccount } = await loadFixture(deployFreshTether);
            await token.connect(owner).addToBlockedList(otherAccount.getAddress());
            await token.connect(owner).destroyBlockedFunds(otherAccount.getAddress());
            const balance = await token.balanceOf(otherAccount.getAddress());
            await expect(balance.toString()).to.equal('0');
        });

        it('destroyBlockedFunds: funds that are not blocked cannot be destroyed by owner', async () => {
            const { token, owner, otherAccount } = await loadFixture(deployFreshTether);
            await expect(token.connect(owner).destroyBlockedFunds(otherAccount.getAddress())).to.be.reverted;
        });
    });
});
