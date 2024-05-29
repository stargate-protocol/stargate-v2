import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import { errorSelectors, errors } from '@stargatefinance/stg-evm-sdk-v2'

async function populate(): Promise<void> {
    const errorDir = path.join(__dirname, '../src/errors')
    // Writing errors to files in the error directory
    await mkdir(errorDir, { recursive: true })
    await writeFile(path.join(errorDir, 'errors.json'), JSON.stringify(errors, null, 2))
    await writeFile(path.join(errorDir, 'errorSelectors.json'), JSON.stringify(errorSelectors, null, 2))
}
populate()
