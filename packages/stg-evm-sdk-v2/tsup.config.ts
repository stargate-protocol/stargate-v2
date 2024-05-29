import { createRequire } from 'module'
import { dirname, join } from 'path'

import { clean } from 'esbuild-plugin-clean'
import { copy } from 'esbuild-plugin-copy'

import { defineConfig, getDefaultConfig } from '@layerzerolabs/tsup-config-next'

const __require = createRequire(import.meta.url)
const stgEvmV2PackagePath = dirname(__require.resolve('@stargatefinance/stg-evm-v2/package.json'))

export default defineConfig({
    ...getDefaultConfig(),
    entry: ['src/index.ts'],
    esbuildPlugins: [
        clean({
            cleanOnStartPatterns: ['./artifacts', './deployments'],
        }),
        copy({
            copyOnStart: true,
            resolveFrom: 'cwd',
            assets: [
                {
                    from: join(stgEvmV2PackagePath, 'artifacts', 'src', '**', '!(*.dbg).json'),
                    to: join('artifacts', 'src'),
                },
                {
                    from: join(stgEvmV2PackagePath, 'deployments', '**', '!(*.dbg).json'),
                    to: 'deployments',
                },
                {
                    from: join(stgEvmV2PackagePath, 'dist', 'deployed', '**'),
                    to: 'dist/deployed',
                },
            ],
        }),
    ],
})
