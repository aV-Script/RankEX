import { defineConfig, devices } from '@playwright/test'
import { QA_BASE_URL }          from './e2e/qa-dev/qaDev.config.js'

/**
 * QA automatica contro l'hosting di rankex-dev (STORY-041). Esecuzione manuale:
 *   npm run qa:dev:seed   → org fisse qa-pt / qa-soccer / qa-lipedema (una volta, idempotente)
 *   npm run qa:dev        → la suite
 *
 * Separata da playwright.config.js (vite locale, account di seed-test-accounts.mjs, CI):
 * qui niente webServer e un solo host, fisso. Il setup rifiuta qualsiasi altro progetto.
 * Gli spec creano solo dati con prefisso E2E-, cancellati dal teardown (Admin SDK).
 */
export default defineConfig({
  testDir:        './e2e/qa-dev/tests',
  globalSetup:    './e2e/qa-dev/global.setup.js',
  globalTeardown: './e2e/qa-dev/global.teardown.js',
  fullyParallel:  false,
  workers:        1,
  retries:        0,
  // La prima chiamata a una Cloud Function dopo inattività può richiedere ~30 s
  timeout:        120_000,
  expect:         { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/qa-dev', open: 'never' }],
  ],
  use: {
    baseURL:    QA_BASE_URL,
    trace:      'retain-on-failure',
    screenshot: 'only-on-failure',
    locale:     'it-IT',
    timezoneId: 'Europe/Rome',
  },
  projects: [
    { name: 'qa-dev', use: { ...devices['Desktop Chrome'] } },
  ],
})
