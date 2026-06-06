/**
 * E2E — Staff readonly
 * Copre: TP-033 (sola lettura, nessun controllo di modifica, ReadonlyBanner)
 */
import { test, expect } from '../fixtures/auth.fixture.js'
import { goto }         from '../helpers/page.js'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

test.describe('TP-033 — Staff readonly', () => {

  test('ReadonlyBanner è visibile', async ({ staffPage: page }) => {
    await goto(page, `${BASE}/`)
    const banner = page.locator('[class*="ReadonlyBanner"], [class*="readonly-banner"]')
      .or(page.getByText(/sola lettura|read.?only/i))
    await expect(banner.first()).toBeVisible({ timeout: 8_000 })
  })

  test('nessun bottone di modifica nella lista clienti', async ({ staffPage: page }) => {
    await goto(page, `${BASE}/clients`)
    await page.waitForLoadState('load')

    // I bottoni "Nuovo cliente", "Aggiungi", "Elimina" non devono essere visibili
    const addBtn = page.getByRole('button', { name: /nuovo cliente|aggiungi cliente/i })
    await expect(addBtn).not.toBeVisible({ timeout: 3_000 })
  })

  test('nella dashboard cliente i bottoni di modifica sono nascosti', async ({ staffPage: page }) => {
    await goto(page, `${BASE}/clients`)
    const firstCard = page.locator('[class*="ClientCard"]').first()
    if (!await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    // Il bottone "Campionamento" non deve essere visibile
    const campBtn = page.getByRole('button', { name: /campionam/i })
    await expect(campBtn).not.toBeVisible({ timeout: 3_000 })

    // Il bottone "Elimina" (cliente) non deve essere visibile
    const deleteBtn = page.getByRole('button', { name: /elimina cliente/i })
    await expect(deleteBtn).not.toBeVisible({ timeout: 3_000 })
  })

  test('lo staff può leggere i dati del cliente', async ({ staffPage: page }) => {
    await goto(page, `${BASE}/clients`)
    const firstCard = page.locator('[class*="ClientCard"]').first()
    if (!await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    // La dashboard del cliente deve caricare correttamente (dati visibili)
    const xpBar = page.locator('[class*="XPBar"], [class*="xp"]').first()
    await expect(xpBar).toBeVisible({ timeout: 8_000 })
  })

  test('calendario visibile in sola lettura', async ({ staffPage: page }) => {
    await goto(page, `${BASE}/`)
    const calLink = page.getByText(/calendario/i)
    if (!await calLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Link calendario non trovato')
      return
    }
    await calLink.first().click()
    await page.waitForLoadState('networkidle')

    // Il calendario deve caricare
    const cal = page.locator('[class*="Calendar"], [class*="calendar"]').first()
    await expect(cal).toBeVisible({ timeout: 8_000 })

    // Il bottone "Nuovo slot" non deve essere visibile
    const addSlot = page.getByRole('button', { name: /nuovo slot|aggiungi slot/i })
    await expect(addSlot).not.toBeVisible({ timeout: 3_000 })
  })

})
