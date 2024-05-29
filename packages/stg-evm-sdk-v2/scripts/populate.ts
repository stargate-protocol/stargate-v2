import { populateErrors } from '@layerzerolabs/evm-sdks-build'

const rootFile = require.resolve('../package.json')
populateErrors(rootFile).catch((err: unknown) => {
    console.error(err)
    process.exitCode = 1
})
