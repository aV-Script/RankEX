/**
 * Auth fixture — ogni test parte con una pagina già autenticata.
 *
 * Firebase Auth usa IndexedDB, non localStorage: Playwright storageState
 * non può catturare i token. La soluzione più robusta è fare il login
 * via UI all'inizio di ogni fixture — dura ~2s ma è sempre affidabile.
 */
import { test as base } from '@playwright/test'
import path              from 'path'

const AUTH_DIR = path.join(import.meta.dirname, '..', '.auth')

// Mantenuti per compatibilità con global.setup.js (opzionale)
export const AUTH_PATHS = {
  trainer:  path.join(AUTH_DIR, 'trainer.json'),
  orgAdmin: path.join(AUTH_DIR, 'org-admin.json'),
  client:   path.join(AUTH_DIR, 'client.json'),
  staff:    path.join(AUTH_DIR, 'staff.json'),
}

const BASE = () => process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

async function loginViaUI(page, email, password) {
  await page.goto(`${BASE()}/login`)
  await page.waitForLoadState('load')
  await page.getByLabel(/email/i).first().fill(email)
  await page.getByLabel(/password/i).first().fill(password)
  await page.getByRole('button', { name: /accedi/i }).click()
  // Aspetta che la URL cambi da /login — segnale che l'auth è andata a buon fine
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
  await page.waitForLoadState('load')
}

export const test = base.extend({

  trainerPage: async ({ page }, use) => {
    await loginViaUI(
      page,
      process.env.E2E_TRAINER_EMAIL    || 'trainer@test.rankex',
      process.env.E2E_TRAINER_PASSWORD || 'TrainerTest1',
    )
    await use(page)
  },

  orgAdminPage: async ({ page }, use) => {
    await loginViaUI(
      page,
      process.env.E2E_ORGADMIN_EMAIL    || 'orgadmin@test.rankex',
      process.env.E2E_ORGADMIN_PASSWORD || 'OrgAdminTest1',
    )
    await use(page)
  },

  clientPage: async ({ page }, use) => {
    await loginViaUI(
      page,
      process.env.E2E_CLIENT_EMAIL    || 'client@test.rankex',
      process.env.E2E_CLIENT_PASSWORD || 'ClientTest1',
    )
    await use(page)
  },

  staffPage: async ({ page }, use) => {
    await loginViaUI(
      page,
      process.env.E2E_STAFF_EMAIL    || 'staff@test.rankex',
      process.env.E2E_STAFF_PASSWORD || 'StaffTest1',
    )
    await use(page)
  },
})

export { expect } from '@playwright/test'
