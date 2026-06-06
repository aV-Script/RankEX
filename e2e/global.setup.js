/**
 * Global setup — eseguito UNA VOLTA prima di tutti i test.
 * Fa login UI per ogni ruolo e salva lo storageState in e2e/.auth/*.json
 * così i test partono già autenticati senza ripetere il login.
 *
 * Viene invocato automaticamente da Playwright grazie a globalSetup in playwright.config.js.
 * Per eseguirlo manualmente:  npm run test:e2e:setup
 */

import { chromium }   from '@playwright/test'
import { mkdirSync }   from 'fs'
import { join }        from 'path'
import { config }      from 'dotenv'
import { AUTH_PATHS }  from './fixtures/auth.fixture.js'

config({ path: '.env.test', override: false })
config({ path: '.env.development', override: false })

// Crea la cartella .auth se non esiste
mkdirSync(join(import.meta.dirname, '.auth'), { recursive: true })

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

async function loginAndSave(browser, email, password, authPath) {
  const ctx  = await browser.newContext()
  const page = await ctx.newPage()

  try {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /accedi/i }).click()

    // Aspetta che il login sia completato (URL cambia da /login)
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
    await page.waitForLoadState('networkidle')

    await ctx.storageState({ path: authPath })
    console.log(`  ✅  ${email}`)
  } catch (err) {
    console.error(`  ❌  ${email}: ${err.message}`)
  } finally {
    await ctx.close()
  }
}

export default async function globalSetup() {
  console.log('\n🔑  Playwright global setup — salvo sessioni auth…\n')

  const browser = await chromium.launch()

  await loginAndSave(
    browser,
    process.env.E2E_TRAINER_EMAIL    || 'trainer@test.rankex',
    process.env.E2E_TRAINER_PASSWORD || 'TrainerTest1',
    AUTH_PATHS.trainer,
  )

  await loginAndSave(
    browser,
    process.env.E2E_ORGADMIN_EMAIL    || 'orgadmin@test.rankex',
    process.env.E2E_ORGADMIN_PASSWORD || 'OrgAdminTest1',
    AUTH_PATHS.orgAdmin,
  )

  await loginAndSave(
    browser,
    process.env.E2E_CLIENT_EMAIL    || 'client@test.rankex',
    process.env.E2E_CLIENT_PASSWORD || 'ClientTest1',
    AUTH_PATHS.client,
  )

  await loginAndSave(
    browser,
    process.env.E2E_STAFF_EMAIL    || 'staff@test.rankex',
    process.env.E2E_STAFF_PASSWORD || 'StaffTest1',
    AUTH_PATHS.staff,
  )

  await browser.close()
  console.log('\n✅  Sessioni auth salvate in e2e/.auth/\n')
}
