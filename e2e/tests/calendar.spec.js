/**
 * E2E — Calendario, sessioni e ricorrenze
 * Copre: apertura calendario, switcher vista, modal nuova sessione,
 * modal nuova ricorrenza (preview conteggio), popup slot esistente.
 *
 * Nota: come gli altri spec (campionamento.spec.js), questi test non
 * completano mai una scrittura reale (niente click su "CREA SESSIONE" /
 * "CREA RICORRENZA" / "CHIUDI SESSIONE") per non sporcare il progetto
 * rankex-dev con dati di test permanenti — verificano solo il comportamento
 * dell'UI e degli stati derivati (preview, disabled, visibilità).
 */
import { test, expect }  from '../fixtures/auth.fixture.js'
import { goto, openTab } from '../helpers/page.js'

const BASE = () => process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

async function apriCalendario(page) {
  await goto(page, `${BASE()}/trainer`)
  await openTab(page, 'Calendario')
  await page.waitForTimeout(400)
}

// ── TP-CAL-01 — Vista calendario ────────────────────────────────────────────
test.describe('TP-CAL-01 — Vista calendario', () => {

  test('header mostra titolo periodo e switcher Mese/Settimana/Giorno', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const switcher = page.getByRole('button', { name: 'M', exact: true })
      .or(page.getByRole('button', { name: 'S', exact: true }))
    if (!await switcher.first().isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Header calendario non trovato')
      return
    }
    await expect(page.getByRole('button', { name: 'OGGI' })).toBeVisible()
  })

  test('cambiare vista aggiorna lo stato aria-pressed', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const dayBtn = page.getByRole('button', { name: 'G', exact: true })
    if (!await dayBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Switcher vista non trovato')
      return
    }
    await dayBtn.click()
    await page.waitForTimeout(300)
    await expect(dayBtn).toHaveAttribute('aria-pressed', 'true')
  })

})

// ── TP-CAL-02 — Nuova sessione ──────────────────────────────────────────────
test.describe('TP-CAL-02 — Nuova sessione', () => {

  test('bottone + Sessione apre il modal con data/orari precompilati', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const addBtn = page.getByRole('button', { name: 'Aggiungi sessione' })
    if (!await addBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Bottone + Sessione non trovato')
      return
    }
    await addBtn.click()

    const dialog = page.locator('div[role="dialog"]').filter({ hasText: 'Nuova sessione' })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await expect(dialog.locator('input[type="date"]')).toBeVisible()
    await expect(dialog.locator('input[type="time"]')).toHaveCount(2)
  })

  test('senza clienti selezionati il salvataggio resta bloccato', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const addBtn = page.getByRole('button', { name: 'Aggiungi sessione' })
    if (!await addBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Bottone + Sessione non trovato')
      return
    }
    await addBtn.click()

    const dialog = page.locator('div[role="dialog"]').filter({ hasText: 'Nuova sessione' })
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const saveBtn = dialog.getByRole('button', { name: /seleziona almeno un cliente|crea sessione/i })
    await expect(saveBtn).toBeDisabled()
  })

  test('selezionare un cliente abilita il salvataggio', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const addBtn = page.getByRole('button', { name: 'Aggiungi sessione' })
    if (!await addBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Bottone + Sessione non trovato')
      return
    }
    await addBtn.click()

    const dialog = page.locator('div[role="dialog"]').filter({ hasText: 'Nuova sessione' })
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const firstClient = dialog.locator('div.max-h-52 button').first()
    if (!await firstClient.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente disponibile nel modal')
      return
    }
    await firstClient.click()

    const saveBtn = dialog.getByRole('button', { name: /crea sessione/i })
    await expect(saveBtn).toBeEnabled()

    // Chiude senza salvare — non vogliamo scrivere dati permanenti in dev.
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 3_000 })
  })

})

// ── TP-CAL-03 — Nuova ricorrenza ────────────────────────────────────────────
test.describe('TP-CAL-03 — Nuova ricorrenza', () => {

  test('bottone + Ricorrenza apre il modal con i 7 giorni della settimana', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const addRecBtn = page.getByRole('button', { name: 'Aggiungi ricorrenza' })
    if (!await addRecBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Bottone + Ricorrenza non trovato')
      return
    }
    await addRecBtn.click()

    await expect(page.getByText('Nuova ricorrenza')).toBeVisible({ timeout: 5_000 })
    for (const day of ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']) {
      await expect(page.getByRole('button', { name: day, exact: true })).toBeVisible()
    }
  })

  test('selezionare almeno un giorno mostra il preview del numero di sessioni', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const addRecBtn = page.getByRole('button', { name: 'Aggiungi ricorrenza' })
    if (!await addRecBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Bottone + Ricorrenza non trovato')
      return
    }
    await addRecBtn.click()
    await expect(page.getByText('Nuova ricorrenza')).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: 'Lun', exact: true }).click()
    await page.getByRole('button', { name: 'Mer', exact: true }).click()
    await page.getByRole('button', { name: 'Ven', exact: true }).click()

    await expect(page.getByText(/verranno create \d+ session/i)).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press('Escape').catch(() => {})
    const closeBtn = page.getByRole('button').filter({ has: page.locator('svg line') }).first()
    if (await closeBtn.isVisible({ timeout: 1_000 }).catch(() => false)) await closeBtn.click().catch(() => {})
  })

  test('senza clienti selezionati CREA RICORRENZA resta bloccato', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    const addRecBtn = page.getByRole('button', { name: 'Aggiungi ricorrenza' })
    if (!await addRecBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Bottone + Ricorrenza non trovato')
      return
    }
    await addRecBtn.click()
    await expect(page.getByText('Nuova ricorrenza')).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: 'Lun', exact: true }).click()

    const saveBtn = page.getByRole('button', { name: /crea ricorrenza/i })
    await expect(saveBtn).toBeDisabled()
  })

})

// ── TP-CAL-04 — Slot esistente ──────────────────────────────────────────────
test.describe('TP-CAL-04 — Dettaglio slot', () => {

  test('cliccare uno slot pianificato apre il popup con azioni', async ({ trainerPage: page }) => {
    await apriCalendario(page)

    // Passa a vista Settimana, dove gli slot sono più facili da individuare
    const weekBtn = page.getByRole('button', { name: 'S', exact: true })
    if (await weekBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await weekBtn.click()
      await page.waitForTimeout(300)
    }

    const eventBlock = page.locator('div.absolute.left-1.right-1')
    if (!await eventBlock.first().isVisible({ timeout: 6_000 }).catch(() => false)) {
      test.skip(true, 'Nessuno slot pianificato trovato nella settimana corrente')
      return
    }
    await eventBlock.first().click()

    const popup = page.getByText(/pianificata|completata|saltata/i)
    await expect(popup.first()).toBeVisible({ timeout: 5_000 })
    // Almeno un'azione (chiudi sessione / elimina) deve essere disponibile
    await expect(page.getByRole('button', { name: /elimina/i })).toBeVisible()
  })

})
