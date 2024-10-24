import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const deployToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { ethers, upgrades } = hre // Use hre.ethers instead of direct ethers import
    const [theDefaultDeployer] = await ethers.getSigners()
    console.log(`Deployer Address: ${theDefaultDeployer.address}`)

    const Token = await ethers.getContractFactory('TetherTokenV2')
    const token = await upgrades.deployProxy(Token, ['aUSD₮', 'aUSD₮', 6], {
        unsafeAllow: ['constructor'],
    })
    await token.deployed()

    const address = token.address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(address)
    const adminAddress = await upgrades.erc1967.getAdminAddress(address)

    console.log(`Token deployed to: ${address}`)
    console.log(`Implementation Address: ${implementationAddress}`)
    console.log(`Admin Address: ${adminAddress}`)
}

export default deployToken

deployToken.tags = ['Token']
