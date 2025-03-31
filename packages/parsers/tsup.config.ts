import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'ParserLib',
  entryPoints: {
    // 'index': 'src/index.ts',
    'NETRIS2/index': 'src/NETRIS2/parser.ts',
  },
  target: 'es2020',
  clean: true,

  format: ['esm'],
  dts: true,
  treeshake: true,
})
