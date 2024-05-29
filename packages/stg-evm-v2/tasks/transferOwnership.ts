import { task } from 'hardhat/config'
import { ActionType } from 'hardhat/types'

import { Ownable } from '../ts-src'
import { getNamedAccount } from '../ts-src/utils/util'

interface TaskArgs {
    from: string
    to: string
    deployment: string
}

const action: ActionType<TaskArgs> = async (taskArgs, hre) => {
    const signerFrom = await hre.getNamedAccounts().then(getNamedAccount(taskArgs.from))
    const from = await hre.ethers.getSigner(signerFrom)

    const signerTo = await hre.getNamedAccounts().then(getNamedAccount(taskArgs.to))
    const to = await hre.ethers.getSigner(signerTo)

    const deploymentName = taskArgs.deployment
    const contractDeployment = await hre.deployments.get(deploymentName)
    const contract = (await hre.ethers.getContractAt(contractDeployment.abi, contractDeployment.address)) as Ownable
    const owner = await contract.owner()
    if (owner !== from.address) {
        console.error(`${from.address} is not the owner of ${deploymentName}, current owner is ${owner}`)
        return
    }
    console.log(`Transferring ownership of ${deploymentName} from ${from.address} to ${to.address}`)
    await (await contract.connect(from).transferOwnership(to.address)).wait()
    console.log(`Ownership of ${deploymentName} transferred to ${await contract.owner()}`)
}

task('transferOwnership', 'transfer ownership to another account', action)
    .addParam('to', 'new owner name')
    .addParam('from', 'old owner name')
    .addParam('deployment', 'deployment file name of the contract')
