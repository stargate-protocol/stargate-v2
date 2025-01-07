import { ethers } from 'ethers'

import { EndpointVersion } from '@layerzerolabs/lz-definitions'

import { getBootstrapChainConfigWithUlnFromArgs } from '@monorepo/args-bootstrap-config'
import { getEndpointV2Contract } from '@monorepo/lz-evm-sdk-v2-contracts'
import {
    getStargateV2CreditMessagingContract,
    getStargateV2TokenMessagingContract,
    isStargateV2SupportedChainName,
} from '@monorepo/stargate-v2-contracts'
import { getChainIdForEndpointVersion } from '@monorepo/static-config'

import {
    ByPathConfig,
    errorString,
    printByPathConfig,
    processPromises,
    timeoutString,
    valueOrTimeout,
} from './utils'

export const getEndpointState = async (args: {
    environment: string
    only: string
    targets: string
}) => {
    const { environment, only, targets: targetsString } = args
    const targets = targetsString.split(',')
    const service = 'stargate'

    const bootstrapChainConfig = await getBootstrapChainConfigWithUlnFromArgs(
        service,
        {
            environment,
            noFork: true,
            only,
        },
        isStargateV2SupportedChainName,
    )

    const endpointState: ByPathConfig = {}

    const fetchEndpointState = async ({
        fromChainName,
        toChainName,
        contract,
    }: {
        fromChainName: string
        toChainName: string
        contract: 'token' | 'credit'
    }) => {
        const contractGetter =
            contract === 'credit'
                ? getStargateV2CreditMessagingContract
                : getStargateV2TokenMessagingContract

        const fromContract = contractGetter(
            fromChainName,
            environment,
            bootstrapChainConfig.providers[fromChainName],
        )

        const toContract = contractGetter(
            toChainName,
            environment,
            bootstrapChainConfig.providers[toChainName],
        )

        const fromEndpointContract = getEndpointV2Contract(
            fromChainName,
            environment,
            bootstrapChainConfig.providers[fromChainName],
        )

        const toEndpointContract = getEndpointV2Contract(
            toChainName,
            environment,
            bootstrapChainConfig.providers[toChainName],
        )

        const [outboundNonce, inboundNonce] = await Promise.all([
            valueOrTimeout(
                () =>
                    fromEndpointContract.outboundNonce(
                        fromContract.address,
                        getChainIdForEndpointVersion(
                            toChainName,
                            environment,
                            EndpointVersion.V2,
                        ),
                        ethers.utils.hexZeroPad(toContract.address, 32),
                    ),
                errorString,
                timeoutString,
            ),
            valueOrTimeout(
                () =>
                    toEndpointContract.inboundNonce(
                        toContract.address,
                        getChainIdForEndpointVersion(
                            fromChainName,
                            environment,
                            EndpointVersion.V2,
                        ),
                        ethers.utils.hexZeroPad(fromContract.address, 32),
                    ),
                errorString,
                timeoutString,
            ),
        ])

        return { inboundNonce, outboundNonce }
    }

    await processPromises(
        'ENDPOINT STATE',
        bootstrapChainConfig.chainNames.flatMap((fromChainName) => {
            endpointState[fromChainName] ??= {}

            return [
                ...bootstrapChainConfig.chainNames
                    .filter((toChainName) => toChainName !== fromChainName)
                    .map((toChainName) => {
                        return async () => {
                            if (
                                targetsString &&
                                !targets.includes(toChainName) &&
                                !targets.includes(fromChainName)
                            ) {
                                return
                            }

                            const { inboundNonce, outboundNonce } =
                                await fetchEndpointState({
                                    fromChainName,
                                    toChainName,
                                    contract: 'credit',
                                })

                            endpointState[fromChainName][toChainName] ??= {}
                            endpointState[fromChainName][toChainName][
                                'creditNonces'
                            ] = `${outboundNonce.toString()}-${inboundNonce.toString()}`
                        }
                    }),
                ...bootstrapChainConfig.chainNames
                    .filter((toChainName) => toChainName !== fromChainName)
                    .map((toChainName) => {
                        return async () => {
                            if (
                                targetsString &&
                                !targets.includes(toChainName) &&
                                !targets.includes(fromChainName)
                            ) {
                                return
                            }

                            const { inboundNonce, outboundNonce } =
                                await fetchEndpointState({
                                    fromChainName,
                                    toChainName,
                                    contract: 'token',
                                })

                            endpointState[fromChainName][toChainName] ??= {}
                            endpointState[fromChainName][toChainName][
                                'tokenNonces'
                            ] = `${outboundNonce.toString()}-${inboundNonce.toString()}`
                        }
                    }),
            ]
        }),
    )

    return endpointState
}

if (require.main === module) {
    const main = async () => {
        const { parse } = await import('@monorepo/args')

        const args = parse({
            header: 'Check Endpoint State',
            description: 'Check Endpoint State',
            args: {
                environment: {
                    alias: 'e',
                    type: String,
                    defaultValue: 'mainnet',
                    description: 'the environment',
                },
                only: {
                    alias: 'o',
                    type: String,
                    defaultValue: '',
                    description: 'chain name to check',
                },
                targets: {
                    alias: 't',
                    type: String,
                    defaultValue: '',
                    description: 'new chain names to check against',
                },
            },
        })

        printByPathConfig('ENDPOINT STATE', await getEndpointState(args))
    }

    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
}
