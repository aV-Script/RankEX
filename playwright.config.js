import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv }    from 'dotenv'

// Carica .env.test se esiste, altrimenti fallback su .env.development
loadEnv({ path: '.env.test', override: false })
loadEnv({ path: '.env.development', override: false })

/**
 * Playwright E2E — RankEX
 *
 * Prerequisiti:
 *   1. Dev server attivo:  npm run dev
 *   2. .env.test con credenziali (generato da seed-test-accounts.mjs)
 *
 * Comandi:
 *   npm run test:e2e:setup   → salva le sessioni auth (una volta)
 *   npm run test:e2e         → tutti i test headless
 *   npm run test:e2e:ui      → UI interattiva Playwright
 *   npx playwright test e2e/tests/auth.spec.js  → solo un file
 */

export default defineConfig({
  testDir:       './e2e/tests',
  globalSetup:   './e2e/global.setup.js',  // salva sessioni prima dei test
  fullyParallel: false,
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 1 : 0,
  workers:       1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL:    process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    locale:     'it-IT',
    timezoneId: 'Europe/Rome',
  },

  projects: [
    // Area app — trainer, org_admin, client, staff_readonly
    {
      name: 'app',
      use:  { ...devices['Desktop Chrome'] },
    },

    // Area admin — super_admin (porta diversa o stesso server)
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_ADMIN_URL || 'http://localhost:5173',
      },
      testMatch: /.*admin\.spec\.js/,
    },

    // Mobile smoke test
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
      },
      testMatch: /.*mobile\.spec\.js/,
    },
  ],

  // Avvia il dev server automaticamente se non è già attivo
  webServer: {
    command:             'npm run dev',
    port:                5173,
    reuseExistingServer: !process.env.CI,
    timeout:             30_000,
  },
})
