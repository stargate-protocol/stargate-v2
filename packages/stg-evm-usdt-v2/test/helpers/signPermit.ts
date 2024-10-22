import { TypedDataField } from '@ethersproject/abstract-signer'
import { fromRpcSig } from 'ethereumjs-util'
import { ethers } from 'ethers'

interface PermitMessage {
    owner: string
    spender: string
    value: ethers.BigNumber
    nonce: number
    deadline: number
}

interface Domain {
    name: string
    version: string
    verifyingContract: string
    chainId: number
}

interface PermitParams {
    chainId: number
    account: ethers.Wallet
    spender: string
    version: string
    tokenName: string
    tokenAddress: string
    amount: ethers.BigNumber
    deadline: number
}

const EIP2612_TYPE: TypedDataField[] = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
]

export const signPermit = async ({
    chainId,
    account,
    spender,
    version,
    tokenName,
    tokenAddress,
    amount,
    deadline,
}: PermitParams) => {
    const message: PermitMessage = {
        owner: await account.getAddress(),
        spender,
        value: amount,
        nonce: 0, // Assumed nonce 0; you can fetch the real nonce if needed
        deadline,
    }

    const domain: Domain = {
        name: tokenName,
        version,
        verifyingContract: tokenAddress,
        chainId,
    }

    const signature = await account._signTypedData(domain, { Permit: EIP2612_TYPE }, message)
    return fromRpcSig(signature)
}
