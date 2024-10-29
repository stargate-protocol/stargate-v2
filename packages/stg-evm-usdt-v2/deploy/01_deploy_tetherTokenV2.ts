// import { HardhatRuntimeEnvironment } from 'hardhat/types'
// import { DeployFunction } from 'hardhat-deploy/types'
// const deployToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//     const { ethers, upgrades } = hre // Use hre.ethers instead of direct ethers import
//     const [theDefaultDeployer] = await ethers.getSigners()
//     console.log(`Deployer Address: ${theDefaultDeployer.address}`)
//     const Token = await ethers.getContractFactory('TetherTokenV2')
//     const token = await upgrades.deployProxy(Token, ['aUSD₮', 'aUSD₮', 6], {
//         unsafeAllow: ['constructor'],
//     })
//     await token.deployed()
//     const address = token.address
//     const implementationAddress = await upgrades.erc1967.getImplementationAddress(address)
//     const adminAddress = await upgrades.erc1967.getAdminAddress(address)
//     console.log(`Token deployed to: ${address}`)
//     console.log(`Implementation Address: ${implementationAddress}`)
//     console.log(`Admin Address: ${adminAddress}`)
// }
// export default deployToken
// deployToken.tags = ['Token']
// MY VERSION
// import assert from 'assert'
// import { type DeployFunction } from 'hardhat-deploy/types'
// import { HardhatRuntimeEnvironment } from 'hardhat/types'
// import { createLogger, printRecord } from '@layerzerolabs/io-devtools'
// /*
//  *
//  * @param {HardhatRuntimeEnvironment} env
//  */
// export const deployTetherTokenV2 =
//     (): DeployFunction =>
//     async ({ getUnnamedAccounts, deployments, network }: HardhatRuntimeEnvironment) => {
//         const [deployer] = await getUnnamedAccounts()
//         assert(deployer, 'Missing deployer')
//         await deployments.delete('TetherTokenV2')
//         const tetherTokenV2 = await deployments.deploy('TetherTokenV2', {
//             from: deployer,
//             proxy: {
//                 owner: deployer,
//                 proxyContract: 'TransparentUpgradeableProxy',
//                 execute: {
//                     init: {
//                         methodName: 'initialize',
//                         args: ['aUSD₮', 'aUSD₮', 6],
//                     },
//                 },
//             },
//         })
//         const logger = createLogger(process.env.LZ_DEVTOOLS_ENABLE_DEPLOY_LOGGING ? 'info' : 'error')
//         logger.info(
//             printRecord({
//                 Network: `${network.name}`,
//                 TetherTokenV2: tetherTokenV2.address,
//             })
//         )
//     }
// export default deployTetherTokenV2
// deployTetherTokenV2.tags = ['Token']
// END MY VERSION
import assert from 'assert';
// import { type DeployFunction } from 'hardhat-deploy/types';
import { DeployFunction } from 'hardhat-deploy/config'

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { createLogger, printRecord } from '@layerzerolabs/io-devtools';
const deployTetherTokenV2: DeployFunction = async function ({
    getNamedAccounts,
    deployments,
    network,
    ethers,
    upgrades
}: HardhatRuntimeEnvironment) {
    const namedAccounts = await getNamedAccounts();
    const deployer = namedAccounts.deployer;
    assert(deployer, 'Missing deployer');
    await deployments.delete('TetherTokenV2'); // Optional: Deletes previous deployments if they exist
    const tetherTokenV2 = await deployments.deploy('TetherTokenV2', {
        from: deployer,
        proxy: {
            owner: deployer,
            proxyContract: '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy',
            execute: {
                init: {
                    methodName: 'initialize',
                    args: ['aUSD₮', 'aUSD₮', 6],
                },
            },
        },
    });
    const logger = createLogger(process.env.LZ_DEVTOOLS_ENABLE_DEPLOY_LOGGING ? 'info' : 'error');
    logger.info(
        printRecord({
            Network: `${network.name}`,
            TetherTokenV2: tetherTokenV2.address,
        })
    );
};
export default deployTetherTokenV2;
deployTetherTokenV2.tags = ['Token'];