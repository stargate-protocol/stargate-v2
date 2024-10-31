
import assert from 'assert';
import { type DeployFunction } from 'hardhat-deploy/types';
// import { DeployFunction } from 'hardhat-deploy/config'

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