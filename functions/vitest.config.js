import { defineConfig } from 'vitest/config'

// Config propria: senza, Vitest risale alla vitest.config.js della web-app
// (include src/__tests__) e non trova i test delle functions.
export default defineConfig({
  test: {
    environment: 'node',
    include:     ['test/**/*.test.js'],
  },
})
