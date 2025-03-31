import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'Lib',
  entryPoints: ['src/index.ts'],
  target: 'es2020',
  clean: true,
  format: ['esm'],
  dts: true,
  treeshake: true,
})
