import { subtask, task } from 'hardhat/config'

import { SignerDefinition } from '@layerzerolabs/devtools-evm'
import {
    SUBTASK_LZ_SIGN_AND_SEND,
    createGnosisSignerFactory,
    createSignerFactory,
    inheritTask,
} from '@layerzerolabs/devtools-evm-hardhat'
import { TASK_LZ_OAPP_WIRE } from '@layerzerolabs/ua-devtools-evm-hardhat'

import { createOneSigSignerFactory } from '../onesig'

import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

/**
 * Extends TASK_LZ_OAPP_WIRE with --onesig flag and overrides sign-and-send logic.
 * Exported as wireTask for use in all task files that inherit from TASK_LZ_OAPP_WIRE.
 *
 * Centralised here so all inheriting tasks pick up --onesig regardless of import order.
 */
task(TASK_LZ_OAPP_WIRE)
    .addFlag('onesig', 'Whether to use oneSig for the transactions')
    .setAction(async (args, hre, runSuper) => {
        overrideSignAndSendTask(args.safe, args.onesig, args.signer)
        return runSuper(args)
    })

export const wireTask = inheritTask(TASK_LZ_OAPP_WIRE)

export function overrideSignAndSendTask(safe: boolean, onesig: boolean, signer: SignerDefinition) {
    if (safe && onesig) {
        throw new Error('Safe and oneSig cannot be used together')
    }

    // if safe, use gnosis signer
    // if onesig, use oneSig signer
    // otherwise, use eoa factory
    const createSigner = safe
        ? createGnosisSignerFactory(signer)
        : onesig
          ? createOneSigSignerFactory(signer)
          : createSignerFactory(signer)

    subtask(SUBTASK_LZ_SIGN_AND_SEND, 'Sign and send transactions', (args: SignAndSendTaskArgs, _hre, runSuper) => {
        return runSuper({
            ...args,
            createSigner,
        })
    })
}
