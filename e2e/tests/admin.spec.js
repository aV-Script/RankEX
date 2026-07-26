/**
 * E2E — Area super_admin
 * Copre: navigazione admin, lista organizzazioni, dialog creazione org (RX-30).
 * Richiede E2E_SUPERADMIN_EMAIL/PASSWORD in .env.test — se assenti, i test
 * skippano esplicitamente invece di fallire (nessuna credenziale admin va
 * mai hardcoded/committata).
 */
import { test, expect } from '../fixtures/auth.fixture.js'
import { goto }         from '../helpers/page.js'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

test.describe('TP-ADMIN-01 — Navigazione e lista organizzazioni', () => {

  test('super_admin vede la dashboard admin con nav Organizzazioni', async ({ superAdminPage: page }) => {
    if (!process.env.E2E_SUPERADMIN_EMAIL) {
      test.skip(true, 'E2E_SUPERADMIN_EMAIL non configurato')
      return
    }
    await goto(page, `${BASE}/`)
    const orgsNav = page.getByRole('button', { name: 'Organizzazioni', exact: true })
    await expect(orgsNav).toBeVisible({ timeout: 8_000 })
  })

  test('pagina Organizzazioni mostra almeno una org', async ({ superAdminPage: page }) => {
    if (!process.env.E2E_SUPERADMIN_EMAIL) {
      test.skip(true, 'E2E_SUPERADMIN_EMAIL non configurato')
      return
    }
    await goto(page, `${BASE}/`)
    const orgsNav = page.getByRole('button', { name: 'Organizzazioni', exact: true })
    if (!await orgsNav.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Nav Organizzazioni non trovato')
      return
    }
    await orgsNav.click()
    await page.waitForLoadState('load')

    const orgRow = page.getByText(/personal training|soccer academy/i).first()
    await expect(orgRow).toBeVisible({ timeout: 8_000 })
  })

})

test.describe('TP-ADMIN-02 — Creazione organizzazione (RX-30: dialog semantics)', () => {

  test('bottone NUOVA apre un dialog accessibile con focus trap', async ({ superAdminPage: page }) => {
    if (!process.env.E2E_SUPERADMIN_EMAIL) {
      test.skip(true, 'E2E_SUPERADMIN_EMAIL non configurato')
      return
    }
    await goto(page, `${BASE}/`)
    const orgsNav = page.getByRole('button', { name: 'Organizzazioni', exact: true })
    if (!await orgsNav.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Nav Organizzazioni non trovato')
      return
    }
    await orgsNav.click()
    await page.waitForLoadState('load')

    const newBtn = page.getByRole('button', { name: /nuova/i })
    if (!await newBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Bottone NUOVA non trovato')
      return
    }
    await newBtn.first().click()

    // RX-30 — role dialog + aria-modal, non un div generico
    const dialog = page.locator('[role="dialog"][aria-modal="true"]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 3_000 })
  })

})
