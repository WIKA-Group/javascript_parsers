import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{ts,js}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/rawParsers/**'],
    coverage: {
      include: ['**/src/devices/**/index.{ts,js}', '**/src/devices/**/shared.{ts,js}', '**/src/codecs/**', '**/parsers/src/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/rawParsers/**', '**/polyfills.ts', '**/schemas.ts', '**/devices/*/index.ts', '**/schema/**', '**/src/codecs/tulip3/lookups.ts'],
    },
  },
})
