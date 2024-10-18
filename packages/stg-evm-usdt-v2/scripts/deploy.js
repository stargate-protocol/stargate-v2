/* eslint-disable no-undef */
const { ethers, upgrades } = require('hardhat');

async function main() {
    /*const Tether = await ethers.getContractFactory('TetherToken')
  const tether = await upgrades.deployProxy(Tether, ['Euro Tether', 'EURT', 6])
  await tether.deployed()
  console.log('Tether deployed to:', tether.address)*/

    [theDefaultDeployer, acc1] = await ethers.getSigners();
    console.log(theDefaultDeployer.address);
    const CeloToken = await ethers.getContractFactory('TetherTokenV2');
    const celoToken = await upgrades.deployProxy(CeloToken, ['aUSD₮', 'aUSD₮', 6], { unsafeAllow: ['constructor'] });
    await celoToken.deployed();
    const celo_address = celoToken.address;
    let implementationAddress = await upgrades.erc1967.getImplementationAddress(celo_address);
    let adminAddress = await upgrades.erc1967.getAdminAddress(celo_address);
    console.log('CeloToken deployed to:', celo_address, implementationAddress, adminAddress);
    const FeeCurrencyWrapper = await ethers.getContractFactory('FeeCurrencyWrapper');
    //const feeCurrencyWrapper = await upgrades.deployProxy(FeeCurrencyWrapper, [celo_address], {unsafeAllow: ["constructor"]})
    //await feeCurrencyWrapper.deployed()
    //const feeCurrencyWrapperAddress = "0x02C65719Da4317d84D808740920d6f6285045660"
    //implementationAddress = await upgrades.erc1967.getImplementationAddress(feeCurrencyWrapperAddress);
    //adminAddress = await upgrades.erc1967.getAdminAddress(feeCurrencyWrapperAddress);
    //console.log('FeeCurrencyWrapper deployed to:', feeCurrencyWrapperAddress, implementationAddress, adminAddress)
    // */
    /*const FeeCurrencyWrapper = await ethers.getContractFactory('FeeCurrencyWrapper')
  const feeCurrencyWrapper = await upgrades.upgradeProxy("0xC4f86E9B4A588D501c1c3e25628dFd50Bc8D615e", FeeCurrencyWrapper, ["0xE9D203F92570113ad888E4361e58130B2623534A"])
  await feeCurrencyWrapper.deployed()
  console.log('FeeCurrencyWrapper deployed to:', await feeCurrencyWrapper.address)
  */
    /*
  const TetherTokenV2 = await ethers.getContractFactory('TetherTokenV2');
  const TetherTokenV0 = await ethers.getContractFactory('TetherTokenKavaV0');
  const PROXY_ADDRESS = "0x919C1c267BC06a7039e03fcc2eF738525769109c"
  await upgrades.forceImport(PROXY_ADDRESS, TetherTokenV0);
  await upgrades.validateUpgrade(PROXY_ADDRESS, TetherTokenV2, {unsafeAllow: ["constructor"]});
  */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
