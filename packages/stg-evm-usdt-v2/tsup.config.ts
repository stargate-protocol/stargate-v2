import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['deployed/*.ts'],
    outDir: 'dist/deployed',
    format: ['cjs', 'esm'],
    sourcemap: true,
    clean: true,
    dts: false,
    esbuildOptions: (options) => {
        options.tsconfig = './tsconfig.json'
    },
    external: ['dotenv/config'], // Marking dotenv as external
})
