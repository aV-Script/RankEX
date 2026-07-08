import { defineConfig } from 'vitest/config'

/**
 * Config separata per i test sulle Firestore Rules — richiedono l'emulatore
 * attivo (avviato via `firebase emulators:exec`, vedi npm script "test:rules").
 * Tenuta fuori da vitest.config.js perché senza emulatore questi test
 * andrebbero in timeout invece che essere semplicemente assenti.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include:     ['tests/rules/**/*.test.js'],
    reporters:   ['verbose'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
