import { defineConfig, getDefaultConfig } from '@layerzerolabs/tsup-config-next';

export default defineConfig({
    ...getDefaultConfig(),
    entry: ['src/index.ts'],
});
