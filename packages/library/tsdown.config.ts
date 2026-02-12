import { defineConfig } from 'tsdown'

export default defineConfig({
  name: 'Lib',
  entry: ['src/index.ts'],
  target: 'es2020',
  clean: true,
  format: ['esm'],
  dts: true,
  treeshake: true,
  inlineOnly: false,
})
