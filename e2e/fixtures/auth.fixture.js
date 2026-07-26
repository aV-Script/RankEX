/**
 * Auth fixture — ogni test parte con una pagina già autenticata.
 *
 * L'app usa browserLocalPersistence (localStorage, non IndexedDB — vedi
 * firebase/services/auth.js), quindi Playwright storageState la cattura
 * correttamente. Il login via UI reale (verifica password contro Firebase
 * Auth) avviene UNA SOLA VOLTA per ruolo in global.setup.js; ogni fixture
 * qui sotto apre un contesto già autenticato da quello storageState invece
 * di rifare login ad ogni singolo test — con decine di test per file,
 * un login per test esauriva rapidamente la quota "verifying passwords"
 * del piano Spark (auth/quota-exceeded), causando skip silenziosi mascherati
 * da "nessun dato trovato".
 */
import { test as base } from '@playwright/test'
import path              from 'path'

const AUTH_DIR = path.join(import.meta.dirname, '..', '.auth')

export const AUTH_PATHS = {
  trainer:    path.join(AUTH_DIR, 'trainer.json'),
  orgAdmin:   path.join(AUTH_DIR, 'org-admin.json'),
  client:     path.join(AUTH_DIR, 'client.json'),
  staff:      path.join(AUTH_DIR, 'staff.json'),
  superAdmin: path.join(AUTH_DIR, 'super-admin.json'),
}

const BASE = () => process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

export async function loginViaUI(page, email, password) {
  await page.goto(`${BASE()}/login`)
  await page.waitForLoadState('load')
  await page.getByLabel(/email/i).first().fill(email)
  await page.getByLabel(/password/i).first().fill(password)
  await page.getByRole('button', { name: /accedi/i }).click()
  // Aspetta che la URL cambi da /login — segnale che l'auth è andata a buon fine
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
  await page.waitForLoadState('load')
}

async function pageFromSavedSession(browser, authPath) {
  const context = await browser.newContext({ storageState: authPath })
  const page    = await context.newPage()
  return page
}

export const test = base.extend({

  trainerPage: async ({ browser }, use) => {
    await use(await pageFromSavedSession(browser, AUTH_PATHS.trainer))
  },

  orgAdminPage: async ({ browser }, use) => {
    await use(await pageFromSavedSession(browser, AUTH_PATHS.orgAdmin))
  },

  clientPage: async ({ browser }, use) => {
    await use(await pageFromSavedSession(browser, AUTH_PATHS.client))
  },

  staffPage: async ({ browser }, use) => {
    await use(await pageFromSavedSession(browser, AUTH_PATHS.staff))
  },

  superAdminPage: async ({ browser }, use) => {
    await use(await pageFromSavedSession(browser, AUTH_PATHS.superAdmin))
  },
})

export { expect } from '@playwright/test'
