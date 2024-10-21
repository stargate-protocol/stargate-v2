import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployCeloToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { ethers, upgrades } = hre // Use hre.ethers instead of direct ethers import
    const [theDefaultDeployer] = await ethers.getSigners()
    console.log(`Deployer Address: ${theDefaultDeployer.address}`)

    const CeloToken = await ethers.getContractFactory('TetherTokenV2')
    const celoToken = await upgrades.deployProxy(CeloToken, ['aUSD₮', 'aUSD₮', 6], {
        unsafeAllow: ['constructor'],
    })
    await celoToken.deployed()

    const celoAddress = celoToken.address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(celoAddress)
    const adminAddress = await upgrades.erc1967.getAdminAddress(celoAddress)

    console.log(`CeloToken deployed to: ${celoAddress}`)
    console.log(`Implementation Address: ${implementationAddress}`)
    console.log(`Admin Address: ${adminAddress}`)
}

export default deployCeloToken

deployCeloToken.tags = ['CeloToken']
