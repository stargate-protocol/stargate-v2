import { EXPECTED_MESSAGE_LIB_VERSION } from '@stargatefinance/stg-definitions-v2'

// messageLibType() enum from IMessageLib
export const MESSAGE_LIB_TYPE_SEND = 0
export const MESSAGE_LIB_TYPE_RECEIVE = 1

export interface PinnedLibs {
    sendLibrary: string
    receiveLibrary: string
}

export async function resolveExpectedLibraries(signerOrProvider: any, endpointAddress: string): Promise<PinnedLibs> {
    const { EndpointV2__factory, IMessageLib__factory } = await import('../../../ts-src/typechain-types')

    const endpoint = EndpointV2__factory.connect(endpointAddress, signerOrProvider)
    const registered = await endpoint.getRegisteredLibraries()

    const versioned = await Promise.all(
        registered.map(async (address) => {
            const lib = IMessageLib__factory.connect(address, signerOrProvider)
            const [{ major, minor, endpointVersion }, libType] = await Promise.all([
                lib.version(),
                lib.messageLibType(),
            ])
            return {
                address,
                major: Number(major),
                minor: Number(minor),
                endpointVersion: Number(endpointVersion),
                libType: Number(libType),
            }
        })
    )

    const { major, minor, endpointVersion } = EXPECTED_MESSAGE_LIB_VERSION
    const matching = versioned.filter(
        (l) => l.major === Number(major) && l.minor === minor && l.endpointVersion === endpointVersion
    )

    const sendLib = matching.find((l) => l.libType === MESSAGE_LIB_TYPE_SEND)
    const receiveLib = matching.find((l) => l.libType === MESSAGE_LIB_TYPE_RECEIVE)

    if (!sendLib || !receiveLib) {
        throw new Error(
            `No library matching version ${major}.${minor}.${endpointVersion} on endpoint ${endpointAddress}. ` +
                `Found: ${JSON.stringify(matching)}`
        )
    }

    return { sendLibrary: sendLib.address, receiveLibrary: receiveLib.address }
}

export async function withRetry<T>(fn: () => Promise<T>, retries: number, delayMs: number): Promise<T> {
    let lastError: unknown
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (e) {
            lastError = e
            if (attempt < retries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
            }
        }
    }
    throw lastError
}

export const MAX_CHAIN_RETRIES = 3
export const RETRY_DELAY_MS = 2000
