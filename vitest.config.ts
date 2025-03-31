import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{ts,js}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/rawParsers/**'],
    coverage: {
      include: ['**/index.{ts,js}', '**/shared.{ts,js}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/rawParsers/**'],
    },
  },
})
