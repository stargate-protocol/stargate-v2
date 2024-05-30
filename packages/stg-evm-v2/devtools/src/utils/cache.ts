import * as fs from 'fs'
import { join, resolve } from 'path'

import { OmniPoint } from '@layerzerolabs/devtools'
import { getNetworkNameForEid } from '@layerzerolabs/devtools-evm-hardhat'
import { createModuleLogger, importDefault, printJson } from '@layerzerolabs/io-devtools'

const cachePath = './.cache/'

export async function getFromCacheOrChain<T>(
    contractName: string,
    point: OmniPoint,
    getFromChain: () => Promise<T>
): Promise<T> {
    const logger = createModuleLogger(`${contractName}: State Loader`)
    const filename = resolve(
        join(cachePath, `${contractName}_${point.address}@${getNetworkNameForEid(point.eid)}.json`)
    )

    try {
        logger.debug(`Opening cache for ${filename}`)
        return (await importDefault(filename)) as T
    } catch (err) {
        logger.verbose(`Failed to open cache for ${filename}`, err)
        return getFromChain().then((value) => (fs.writeFileSync(filename, printJson(value)), value))
    }
}
