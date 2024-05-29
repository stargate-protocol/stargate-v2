import { getDefaultConfig } from '@layerzerolabs/tsup-config-next'
import { defineConfig } from 'tsup'

export default defineConfig({
    ...getDefaultConfig(),
    entry: ['src/index.ts'],
})
