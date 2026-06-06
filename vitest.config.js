import { defineConfig } from 'vitest/config'
import { resolve }      from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include:     ['src/__tests__/**/*.test.js'],
    reporters:   ['verbose'],
    coverage: {
      provider: 'v8',
      include:  ['src/utils/**', 'src/config/**', 'src/constants/**'],
      exclude:  ['src/constants/tests.js', 'src/constants/bia.js'],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
