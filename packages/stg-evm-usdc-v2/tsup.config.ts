import { defineConfig, getDefaultConfig } from '@layerzerolabs/tsup-config-next'

const packageJSON = require('./package.json')

const external = packageJSON.devDependencies ? Object.keys(packageJSON.devDependencies) : []

export default defineConfig([
    {
        ...getDefaultConfig(),
        entry: {
            index: 'ts-src/index.ts',
        },
        external,
    },
    {
        ...getDefaultConfig(),
        entry: ['deployed/*.ts'],
        outDir: 'dist/deployed',
    },
])
