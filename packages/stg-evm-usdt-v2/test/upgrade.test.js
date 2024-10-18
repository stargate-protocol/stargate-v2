require('@nomicfoundation/hardhat-chai-matchers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('Upgrades', async () => {
    it('an upgraded version of the token can have its name and symbol changed but keep same balance state', async () => {
        const TetherToken = await ethers.getContractFactory('TetherToken');
        const ExampleUpgradedToken = await ethers.getContractFactory('ExampleUpgradedToken');

        const [owner] = await ethers.getSigners();

        const tetherV1 = await upgrades.deployProxy(TetherToken, ['GreatBritishTether', 'GBPT', 6], {
            unsafeAllow: ['constructor'],
        });
        const name1 = await tetherV1.name();
        await expect(name1).to.equal('GreatBritishTether');

        await tetherV1.mint(owner.getAddress(), 1234567);

        try {
            await tetherV1.newFunctionNotPreviouslyDefined();
        } catch (e) {
            await expect(e.toString()).to.equal(
                'TypeError: tetherV1.newFunctionNotPreviouslyDefined is not a function'
            );
        }

        const tetherV2 = await upgrades.upgradeProxy(tetherV1.address, ExampleUpgradedToken, {
            unsafeAllow: ['constructor'],
        });
        const name2 = await tetherV2.name();
        await expect(name2).to.equal(name1);

        const balance = await tetherV2.balanceOf(owner.getAddress());
        await expect(balance.toString()).to.equal('1234567');

        const bool = await tetherV2.newFunctionNotPreviouslyDefined();
        await expect(bool).to.equal(true);
    });
});
