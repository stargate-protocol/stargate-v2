import { writeFileSync } from 'fs'
import { createRequire } from 'module'
import { dirname, join } from 'path'

import { contracts } from '@stargatefinance/stg-evm-v2/deployed'
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
        {
            name: 'Generate error ABI fragments',
            setup({ onStart }) {
                onStart(() => {
                    // We'll create a list of all the errors found in all the stargate contracts
                    const errorEntries = Object.values(contracts)
                        // First we get one ABI per network for every contract
                        .flatMap(({ abis: abisByNetworkName }) => Object.values(abisByNetworkName))
                        // Then we flatten all the ABIs into one massive ABI
                        .flat()
                        // Then we take the error fragments out
                        .filter((fragment: any) => fragment.type === 'error')
                        // Then we'll need to deduplicate the errors so we create a hash key by stringifying the error
                        //
                        // Simple yet effective
                        .map((fragment) => [JSON.stringify(fragment), fragment] as const)

                    // Now that we have the errors in array of [hash, fragment] tuples, we can just deduplicate them
                    // by turning them into an object and getting all of its values
                    const errors = Object.values(Object.fromEntries(errorEntries))

                    writeFileSync(join('src', 'errors.json'), JSON.stringify(errors, null, '\t'))
                })
            },
        },
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
