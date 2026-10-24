/**
 * Flussi reali con salvataggio — gli altri spec si fermano prima di scrivere.
 * Girano contro rankex-dev con gli account di test (org test-org-pt) e
 * verificano il risultato sui dati, non solo sull'interfaccia:
 *   - campionamento: salvato e conteggiato una volta
 *   - chiusura sessione con doppio click: XP assegnati una sola volta
 *   - nuovo cliente con email già usata: errore sul campo email, nessun cliente creato
 *   - cliente: vede la propria scheda di allenamento
 */
import { test, expect } from '../fixtures/auth.fixture.js'
import { goto } from '../helpers/page.js'

const CLIENT_NAME = 'Mario Rossi (Test)'
// Valori realistici per i 5 test Active (uomo, 30 anni) — stesso ordine del form
const ACTIVE_VALUES = ['45', '100', '65', '105', '100', '64', '104', '99', '90', '90', '220', '1.85']

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function openClient(page) {
  await goto(page, '/clients')
  await page.locator('button[class*="rx-card"]').filter({ hasText: CLIENT_NAME }).first().click()
  await expect(page.getByText(/EXP/).first()).toBeVisible({ timeout: 15_000 })
}

/** Legge livello, XP, soglia e numero di campionamenti dal tab ATLETA */
async function readAtleta(page) {
  const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
  const level = Number(text.match(/(\d+) LV\./)?.[1])
  const [, xp, xpNext] = text.match(/EXP (\d+) \/ (\d+)/) ?? []
  const camps = Number(text.match(/(\d+) CAMPIONAMENTI/)?.[1])
  return { level, xp: Number(xp), xpNext: Number(xpNext), camps }
}

test.describe('Flussi reali (scrivono su rankex-dev)', () => {
  // Più salvataggi per test, e la prima chiamata a una Cloud Function dopo
  // inattività può richiedere ~30 s
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('campionamento: salvato e conteggiato una volta', async ({ trainerPage: page }) => {
    await openClient(page)
    const before = await readAtleta(page)

    // Il testo è maiuscolo solo via CSS: nel DOM è "Test"
    await page.locator('button', { hasText: /^\s*test\s*$/i }).first().click()
    await page.getByRole('button', { name: /campionamento/i }).click()
    const inputs = page.locator('input[type="number"]')
    await expect(inputs).toHaveCount(ACTIVE_VALUES.length)
    for (let i = 0; i < ACTIVE_VALUES.length; i++) await inputs.nth(i).fill(ACTIVE_VALUES[i])

    await page.getByRole('button', { name: /^salva$/i }).click()
    await page.locator('[role="dialog"]').getByRole('button', { name: /salva/i }).last().click()
    await expect(page.getByText('Campionamento salvato')).toBeVisible({ timeout: 30_000 })

    await openClient(page)
    const after = await readAtleta(page)
    expect(after.camps).toBe(before.camps + 1)
  })

  test('chiusura sessione con doppio click: XP assegnati una volta sola', async ({ trainerPage: page }) => {
    await openClient(page)
    const before = await readAtleta(page)

    // Orario diverso a ogni esecuzione per non unirsi a sessioni di run precedenti
    const minute = String(new Date().getMinutes()).padStart(2, '0')
    await goto(page, '/trainer')
    await page.getByRole('button', { name: 'Calendario', exact: true }).first().click()
    await page.getByRole('button', { name: `Aggiungi sessione il ${todayStr()}`, exact: true }).click()
    const addDialog = page.locator('div[role="dialog"]').filter({ hasText: 'Nuova sessione' })
    await addDialog.locator('input[type="time"]').nth(0).fill(`05:${minute}`)
    await addDialog.locator('input[type="time"]').nth(1).fill('05:59')
    await addDialog.locator('div.max-h-52 button').filter({ hasText: CLIENT_NAME }).first().click()
    await addDialog.getByRole('button', { name: /crea sessione/i }).click()
    await expect(addDialog).toBeHidden({ timeout: 30_000 })

    await page.getByRole('button', { name: 'G', exact: true }).click()
    const event = page.getByText(new RegExp(`05:${minute}`)).first()
    await event.scrollIntoViewIfNeeded()
    await event.click()
    await page.locator('[role="dialog"]').last().getByRole('button', { name: /chiudi sessione/i }).click()

    const closeDialog = page.locator('[role="dialog"]').filter({ hasText: /presenze/i }).last()
    const gain = Number((await closeDialog.innerText()).match(/\+(\d+) XP/)?.[1])
    expect(gain).toBeGreaterThan(0)
    await closeDialog.getByRole('button', { name: /chiudi sessione/i }).dblclick()
    await expect(closeDialog).toBeHidden({ timeout: 30_000 })

    await openClient(page)
    const after = await readAtleta(page)
    const expectedXp = after.level === before.level ? before.xp + gain : before.xp + gain - before.xpNext
    expect(after.level - before.level).toBeLessThanOrEqual(1)
    expect(after.xp).toBe(expectedXp)
  })

  test('nuovo cliente con email già usata: errore sul campo email', async ({ trainerPage: page }) => {
    await goto(page, '/clients')
    const countBefore = await page.locator('button[class*="rx-card"]').count()

    await page.getByText('+ NUOVO').first().click()
    await page.getByPlaceholder('Mario Rossi').first().fill('E2E Email Duplicata')
    await page.locator('input[type="date"]').first().fill('1990-05-15')
    await page.getByLabel(/peso/i).fill('70')
    await page.getByLabel(/altezza/i).fill('175')
    await page.getByRole('button', { name: /avanti/i }).click()
    await page.getByRole('button', { name: /solo test/i }).click()
    await page.getByRole('button', { name: /avanti/i }).click()
    await page.getByText(/^active$/i).first().click()
    await page.getByRole('button', { name: /avanti/i }).click()
    await page.getByLabel(/email/i).first().fill('trainer@test.rankex')
    await page.getByLabel(/password/i).first().fill('ProvaTest123')
    await page.getByRole('button', { name: /crea cliente/i }).last().click()
    await page.locator('[role="dialog"]').getByRole('button', { name: /crea cliente/i }).click()

    // Il primo avvio della Cloud Function dopo inattività può richiedere ~30 s
    await expect(page.locator('#wizard-email-error')).toHaveText(/già in uso/i, { timeout: 60_000 })
    await goto(page, '/clients')
    await expect(page.locator('button[class*="rx-card"]')).toHaveCount(countBefore)
  })

  test('il cliente vede la propria scheda di allenamento', async ({ clientPage: page }) => {
    await goto(page, '/client')
    await page.getByRole('button', { name: /scheda/i }).first().click()
    await expect(page.getByText(/scheda allenamento/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Scheda non disponibile')).toHaveCount(0)
  })
})
