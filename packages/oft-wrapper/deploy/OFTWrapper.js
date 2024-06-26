const MULTI_SIGS = require("../constants/multisig.json")
const verify = require('@layerzerolabs/verify-contract')

const {Wallet, utils, Provider} = require("zksync-web3");
const {Deployer}  = require("@matterlabs/hardhat-zksync-deploy");

module.exports = async function ({ deployments, getNamedAccounts }) {
    const defaultBps = 2


    if (hre.network.name == 'zksync-mainnet') {
        // https://era.zksync.io/docs/tools/hardhat/getting-started.html#interact-with-the-contract

        // deploy contract on zkSync
        // index the 2nd position of the wallet to get our deployer wallet
        const wallet = Wallet.fromMnemonic(process.env.MNEMONIC, 'm/44\'/60\'/0\'/0/2');

        const deployer = new Deployer(hre, wallet);
        const artifact = await deployer.loadArtifact("OFTWrapper");
        const constructorArgs = [defaultBps]

        // Estimate contract deployment fee
        // const deploymentFee = await deployer.estimateDeployFee(artifact, constructorArgs);
        // const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
        // console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

        const oftWrapper = await deployer.deploy(artifact, constructorArgs);
        // obtain the Constructor Arguments
        console.log(
            "constructor args:" + oftWrapper.interface.encodeDeploy(constructorArgs)
        );

        // Show the contract info.
        const contractAddress = oftWrapper.address;
        console.log(`${artifact.contractName} was deployed to ${contractAddress}`);


        // contract interactions...
        const provider = new Provider(hre.userConfig.networks?.['zksync-mainnet']?.url);
        const signer = new ethers.Wallet(wallet.privateKey, provider);

        // Initialise contract instance
        const contract = new ethers.Contract(
            MULTI_SIGS[hre.network.name],
            artifact.abi,
            signer
        );

        // send transaction to update the message
        const tx = await contract.transferOwnership("0x1D7C6783328C145393e84fb47a7f7C548f5Ee28d");

        console.log(`Transaction to change the message is ${tx.hash}`);
        await tx.wait();

        // Read message after transaction
        console.log(`The message now is ${await contract.owner()}`);
    } else {

        // uncomment to tweak wallet indexes for same deployment addresses
        // if (hre.network.name == "kava") {
            const signer = (await ethers.getSigners())[2]

            // includes pending TX count
            const currentWalletNonce = await ethers.provider.getTransactionCount(signer.address, 'pending')
            // gets wallet to this nonce, NOT the 'next' nonce to be used
            const desiredWalletNonce = 14

            // number of tx to achieve desired wallet nonce
            let txNum = desiredWalletNonce - currentWalletNonce

            // nonce starts at 0, so use <= in loop
            for (let i = 0 ; i <= txNum; i++) {
                await signer.sendTransaction({
                    to: signer.address,
                    value: ethers.utils.parseEther("0"), // Sends exactly 1.0 ether
                });
            }
        // }

        const { deploy } = deployments
        const { deployer } = await getNamedAccounts()

        console.log(`Network: ${hre.network.name}`)
        console.log(`Deployer: ${deployer}`)


        // const { address } = await deploy("OFTWrapper", {
        //     from: deployer,
        //     args: [defaultBps],
        //     log: true,
        //     waitConfirmations: 3,
        //     skipIfAlreadyDeployed: false,
        // })
        //
        // const newOwner = MULTI_SIGS[hre.network.name]
        // console.log("New owner: ", newOwner)
        // let accounts = await ethers.getSigners()
        // let owner = accounts[2] // me
        // let oftWrapper = await ethers.getContract("OFTWrapper")
        // await oftWrapper.connect(owner).transferOwnership(newOwner)
        //
        await verify(hre.network.name, ["OFTWrapper"])
    }

}

module.exports.tags = ["OFTWrapper", "test"]
