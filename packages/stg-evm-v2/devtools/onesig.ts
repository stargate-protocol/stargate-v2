import { OneSigConfig } from '@stargatefinance/stg-definitions-v2'
import axios from 'axios'
import { BigNumber, ethers } from 'ethers'
import pMemoize from 'p-memoize'

import { OmniSignerFactory, OmniTransaction, OmniTransactionResponse } from '@layerzerolabs/devtools'
import { OmniSignerEVMBase, SignerDefinition } from '@layerzerolabs/devtools-evm'
import {
    createGetHreByEid,
    createProviderFactory,
    createSignerAddressOrIndexFactory,
} from '@layerzerolabs/devtools-evm-hardhat'
import { EndpointId } from '@layerzerolabs/lz-definitions'
import { getSigningData, makeOneSigTree } from '@layerzerolabs/onesig-core'
import { ETHLeafData, evmLeafGenerator } from '@layerzerolabs/onesig-evm'

export interface OneSigProposedTransactionSignature {
    signature: string
    dataHash: string
}
export interface OneSigBatch {
    // When proposing a batch, the convention is one transaction per leaf
    oneSigTransactions: ETHLeafData[]
    seed: string
    expiry: number
}

export interface OneSigSignedBatch extends OneSigBatch {
    proposerSignature: string
}

// API request types
export interface OneSigProposeTransactionRequest {
    proposedTransactions: {
        chainName: string
        oneSigId: string
        callData: {
            to: string
            value: string
            data: string
        }
        order: number
        targetOneSigAddress: string
        gasLimit?: string
        metadata?: {
            contract?: string
            method?: string
            args?: any[]
            oldValue?: any
            newValue?: any
            localEid?: number
            remoteEid?: number
        }
        description?: string
    }[]
    proposerSignature: string
    seed: string
    expiry: number
}

/**
 * Implements an OmniSigner interface for EVM-compatible chains using Gnosis Safe.
 */
export class OneSigSignerEVM extends OmniSignerEVMBase {
    constructor(
        eid: EndpointId,
        readonly signer: ethers.providers.JsonRpcSigner,
        protected readonly oneSigConfig: OneSigConfig
    ) {
        super(eid, signer)
    }

    async sign(transaction: OmniTransaction): Promise<string> {
        const oneSigBatch = await this.#createAndSignOneSigBatch([transaction])
        return oneSigBatch.proposerSignature
    }

    async signAndSend(transaction: OmniTransaction): Promise<OmniTransactionResponse> {
        return this.signAndSendBatch([transaction])
    }

    async signAndSendBatch(transactions: OmniTransaction[]): Promise<OmniTransactionResponse> {
        if (transactions.length === 0) {
            throw new Error('/signAndSendBatch received 0 transactions')
        }

        const oneSigBatch = await this.#createAndSignOneSigBatch(transactions)
        return await this.#proposeOneSigBatch(oneSigBatch)
    }

    async #getNextNonce(): Promise<number> {
        const { oneSigUrl, oneSigAddress } = this.oneSigConfig
        const response = await axios.get<{ nextNonce: number }>(`${oneSigUrl}/api/v1/${oneSigAddress}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        return response.data.nextNonce
    }

    async #getOneSigName(): Promise<string> {
        const { oneSigUrl, oneSigAddress } = this.oneSigConfig

        const oneSigName = (
            await axios.get<{ name: string }>(`${oneSigUrl}/api/v1/${oneSigAddress}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        ).data.name

        return oneSigName
    }

    async #createAndSignOneSigBatch(transactions: OmniTransaction[]): Promise<OneSigSignedBatch> {
        transactions.forEach((transaction) => this.assertTransaction(transaction))

        const startNonce = await this.#getNextNonce()

        const oneSigTransactions: ETHLeafData[] = transactions.map((transaction, index) => {
            const nonce = startNonce + index
            return {
                nonce: BigInt(nonce),
                oneSigId: BigInt(0),
                targetOneSigAddress: this.oneSigConfig.oneSigAddress,
                // When proposing a batch, the convention is one transaction per leaf
                calls: [
                    {
                        to: transaction.point.address,
                        value: BigNumber.from(transaction.value ?? 0),
                        data: transaction.data,
                    },
                ],
            }
        })

        // Merkleize the transactions to propose
        const generatedEvmLeaves = evmLeafGenerator(oneSigTransactions)
        const merkleTree = makeOneSigTree([generatedEvmLeaves])

        // Currently the API doesn't care about these for proposals
        const seed = '0x0000000000000000000000000000000000000000000000000000000000000000'
        const expiry = 0

        const signingOptions = {
            seed,
            expiry,
        }

        const signingData: Parameters<ethers.Wallet['_signTypedData']> = getSigningData(merkleTree, signingOptions)

        // Sign the batch
        const proposerSignature: string = await this.signer._signTypedData(...signingData)

        const result: OneSigSignedBatch = {
            oneSigTransactions,
            seed,
            expiry,
            proposerSignature,
        }
        return result
    }

    async #proposeOneSigBatch(oneSigBatch: OneSigSignedBatch): Promise<OmniTransactionResponse> {
        const { oneSigUrl, oneSigAddress } = this.oneSigConfig

        const oneSigName = await this.#getOneSigName()

        const oneSigUrlComponents = oneSigUrl.split('/')

        // Chain name is the last component of the base oneSigUrl
        const chainName = oneSigUrlComponents[oneSigUrlComponents.length - 1]

        const oneSigUrlWithoutChainName = oneSigUrl.substring(0, oneSigUrl.lastIndexOf('/'))

        const proposeTransactionRequest: OneSigProposeTransactionRequest = {
            proposedTransactions: oneSigBatch.oneSigTransactions.map((transaction) => ({
                chainName,
                oneSigId: transaction.oneSigId.toString(),
                callData: {
                    to: transaction.calls[0].to,
                    value: transaction.calls[0].value.toString(),
                    data: transaction.calls[0].data,
                },
                order: Number(transaction.nonce),
                targetOneSigAddress: oneSigAddress,
            })),
            proposerSignature: oneSigBatch.proposerSignature,
            seed: oneSigBatch.seed,
            expiry: oneSigBatch.expiry,
        }

        await axios.post(`${oneSigUrlWithoutChainName}/api/v1/${oneSigName}/transactions`, proposeTransactionRequest, {
            headers: {
                'Content-Type': 'application/json',
            },
        })

        return {
            transactionHash: oneSigBatch.proposerSignature,
            wait: async (_confirmations?: number) => {
                return {
                    transactionHash: oneSigBatch.proposerSignature,
                }
            },
        }
    }
}

export const createOneSigSignerFactory = (
    definition?: SignerDefinition,
    networkEnvironmentFactory = createGetHreByEid(),
    providerFactory = createProviderFactory(networkEnvironmentFactory),
    signerAddressorIndexFactory = createSignerAddressOrIndexFactory(definition, networkEnvironmentFactory)
): OmniSignerFactory<OneSigSignerEVM> => {
    return pMemoize(async (eid) => {
        const provider = await providerFactory(eid)
        const addressOrIndex = await signerAddressorIndexFactory(eid)
        const signer = provider.getSigner(addressOrIndex)

        const env = await networkEnvironmentFactory(eid)
        const oneSigConfig = env.network.config.oneSigConfig
        if (!oneSigConfig) {
            throw new Error('No OneSig config found for the current network')
        }
        return new OneSigSignerEVM(eid, signer, oneSigConfig)
    })
}
