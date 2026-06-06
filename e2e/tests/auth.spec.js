/**
 * E2E — Autenticazione
 * Copre: TP-001 (login/redirect), TP-003 (password obbligatoria), TP-005 (logout)
 */
import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

test.describe('TP-001 — Login e redirect per ruolo', () => {

  test('login con credenziali errate mostra errore leggibile', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel(/email/i).fill('nonexiste@test.rankex')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /accedi/i }).click()

    const errore = page.locator('[class*="error"], [class*="alert"], [role="alert"]')
    await expect(errore).toBeVisible({ timeout: 5_000 })
    // Il messaggio non deve esporre dettagli tecnici Firebase
    await expect(errore).not.toContainText('auth/')
  })

  test('login come trainer → TrainerShell visibile', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel(/email/i).fill(process.env.E2E_TRAINER_EMAIL || 'trainer@test.rankex')
    await page.getByLabel(/password/i).fill(process.env.E2E_TRAINER_PASSWORD || 'TrainerTest1')
    await page.getByRole('button', { name: /accedi/i }).click()

    // Dopo login il trainer vede la propria dashboard
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 })
    // Sidebar/nav trainer deve essere visibile
    const nav = page.locator('nav, [class*="sidebar"], [class*="shell"]').first()
    await expect(nav).toBeVisible()
  })

  test('accesso diretto alla dashboard senza auth → redirect a /login', async ({ page }) => {
    await page.goto(`${BASE}/clients`)
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })

})

test.describe('TP-005 — Logout', () => {

  test('logout reindirizza al login', async ({ browser }) => {
    // Usa storageState del trainer per partire autenticato
    let ctx
    try {
      ctx = await browser.newContext({ storageState: 'e2e/.auth/trainer.json' })
    } catch {
      test.skip(true, 'Sessione trainer non disponibile — eseguire global-setup prima')
      return
    }
    const page = await ctx.newPage()
    await page.goto(`${BASE}/`)
    await page.waitForLoadState('load')

    // Clicca il bottone logout (cerca per testo o icona)
    const logoutBtn = page.getByRole('button', { name: /logout|esci/i })
      .or(page.getByTitle(/logout|esci/i))
    await logoutBtn.first().click()

    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
    await ctx.close()
  })

})

test.describe('TP-003 — Cambio password obbligatorio al primo accesso', () => {

  test('cliente con mustChangePassword=true vede ChangePasswordScreen', async ({ page }) => {
    // Questo test richiede un account con mustChangePassword=true in Firestore
    // Configurare E2E_NEWCLIENT_EMAIL / PASSWORD in .env.test
    const email    = process.env.E2E_NEWCLIENT_EMAIL
    const password = process.env.E2E_NEWCLIENT_PASSWORD

    if (!email || !password) {
      test.skip(true, 'E2E_NEWCLIENT_EMAIL non configurato')
      return
    }

    await page.goto(`${BASE}/login`)
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /accedi/i }).click()
    await page.waitForLoadState('networkidle')

    // Deve apparire la schermata di cambio password, NON la dashboard
    const changeScreen = page.locator('[class*="change-password"], [class*="ChangePassword"]')
      .or(page.getByText(/cambia password/i))
    await expect(changeScreen).toBeVisible({ timeout: 8_000 })
  })

  test('password non valida mostra errore specifico', async ({ page }) => {
    const email    = process.env.E2E_NEWCLIENT_EMAIL
    const password = process.env.E2E_NEWCLIENT_PASSWORD
    if (!email || !password) {
      test.skip(true, 'E2E_NEWCLIENT_EMAIL non configurato')
      return
    }

    await page.goto(`${BASE}/login`)
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /accedi/i }).click()
    await page.waitForLoadState('networkidle')

    // Inserisci nuova password debole
    const nuovaPw = page.getByPlaceholder(/nuova password/i)
      .or(page.getByLabel(/nuova password/i))
    if (await nuovaPw.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nuovaPw.fill('troppo')
      await page.getByRole('button', { name: /salva|conferma/i }).click()
      const err = page.locator('[class*="error"]').or(page.getByText(/minimo 8/i))
      await expect(err).toBeVisible({ timeout: 3_000 })
    }
  })

})
