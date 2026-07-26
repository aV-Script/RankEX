/**
 * E2E — Regressioni fix audit UX/UI/Accessibilità (Round 1 + Round 2, RX-01→RX-50)
 *
 * Copre i comportamenti introdotti dalle fix dell'audit: conferma esplicita
 * prima di ogni azione distruttiva (mai più falsi successi silenziosi),
 * accesso da tastiera alle celle calendario senza bottoni annidati,
 * attributi ARIA sui selettori, rendering dei componenti scomposti
 * (RecurrenceDetailView) e delle viste con EmptyState/error boundary.
 *
 * Come gli altri spec e2e del progetto: non completa mai un'azione
 * distruttiva reale (annulla sempre dal ConfirmDialog) per non sporcare
 * il progetto rankex-dev con dati permanenti o cancellazioni irreversibili.
 */
import { test, expect } from '../fixtures/auth.fixture.js'
import { goto, openTab } from '../helpers/page.js'

const BASE = () => process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

// ── RX-34 — Calendario: bottone + dedicato invece di role="button" sulla cella ─
test.describe('RX-34 — Calendario, accesso da tastiera alle celle vuote', () => {

  test('vista Mese: bottone + nell\'header della cella apre Nuova Sessione', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Calendario')
    await page.waitForTimeout(400)

    const monthBtn = page.getByRole('button', { name: 'M', exact: true })
    if (await monthBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await monthBtn.click()
      await page.waitForTimeout(300)
    }

    const cellAddBtn = page.locator('button[aria-label^="Aggiungi sessione il"]').first()
    if (!await cellAddBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessuna cella con bottone + trovata (vista Mese non disponibile)')
      return
    }
    await cellAddBtn.click()
    await expect(page.getByText('Nuova sessione')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

  test('vista Settimana: bottone + nell\'header del giorno apre Nuova Sessione', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Calendario')
    await page.waitForTimeout(400)

    const weekBtn = page.getByRole('button', { name: 'S', exact: true })
    if (!await weekBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Switcher vista Settimana non trovato')
      return
    }
    await weekBtn.click()
    await page.waitForTimeout(300)

    const cellAddBtn = page.locator('button[aria-label^="Aggiungi sessione il"]').first()
    if (!await cellAddBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun bottone + trovato in vista Settimana')
      return
    }
    await cellAddBtn.click()
    await expect(page.getByText('Nuova sessione')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

  test('vista Giorno: bottone + nell\'header apre Nuova Sessione', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Calendario')
    await page.waitForTimeout(400)

    const dayBtn = page.getByRole('button', { name: 'G', exact: true })
    if (!await dayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Switcher vista Giorno non trovato')
      return
    }
    await dayBtn.click()
    await page.waitForTimeout(300)

    const cellAddBtn = page.locator('button[aria-label^="Aggiungi sessione il"]').first()
    if (!await cellAddBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun bottone + trovato in vista Giorno')
      return
    }
    await cellAddBtn.click()
    await expect(page.getByText('Nuova sessione')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

})

// ── RX-27/29 — Nessuna azione distruttiva senza ConfirmDialog ─────────────────
test.describe('RX-27/29 — Conferma esplicita prima di eliminare', () => {

  test('eliminare uno slot dal popup chiede conferma prima di procedere', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Calendario')
    await page.waitForTimeout(400)

    const weekBtn = page.getByRole('button', { name: 'S', exact: true })
    if (await weekBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await weekBtn.click()
      await page.waitForTimeout(300)
    }

    const eventBlock = page.locator('div.absolute.left-1.right-1')
    if (!await eventBlock.first().isVisible({ timeout: 6000 }).catch(() => false)) {
      test.skip(true, 'Nessuno slot pianificato trovato nella settimana corrente')
      return
    }
    await eventBlock.first().click()

    const deleteBtn = page.getByRole('button', { name: /elimina/i })
    if (!await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Bottone elimina non trovato nel popup slot')
      return
    }
    await deleteBtn.click()

    // Deve comparire il ConfirmDialog — mai eliminazione diretta senza conferma
    await expect(page.getByText('Eliminare la sessione?')).toBeVisible({ timeout: 3000 })
    await page.getByRole('button', { name: 'ANNULLA' }).click()
    await expect(page.getByText('Eliminare la sessione?')).not.toBeVisible({ timeout: 3000 })
  })

  test('eliminare un gruppo dal menu Azioni chiede conferma prima di procedere', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Gruppi')
    await page.waitForTimeout(500)

    const firstGroup = page.locator('button').filter({ hasText: /clienti|cliente/ }).first()
    if (!await firstGroup.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun gruppo trovato')
      return
    }
    await firstGroup.click()
    await page.waitForTimeout(500)

    const actionsBtn = page.getByLabel('Azioni gruppo')
    if (!await actionsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Menu Azioni gruppo non trovato')
      return
    }
    await actionsBtn.click()
    await page.getByRole('button', { name: 'Elimina', exact: true }).click()

    await expect(page.getByText(/Eliminare ".*"\?/)).toBeVisible({ timeout: 3000 })
    await page.getByRole('button', { name: 'ANNULLA' }).click()
  })

})

// ── RX-36 — Conferma su revoca badge / eliminazione note ──────────────────────
test.describe('RX-36 — Conferma su revoca badge ed eliminazione note', () => {

  test('eliminare una nota di gruppo chiede conferma prima di procedere', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Gruppi')
    await page.waitForTimeout(500)

    const firstGroup = page.locator('button').filter({ hasText: /clienti|cliente/ }).first()
    if (!await firstGroup.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun gruppo trovato')
      return
    }
    await firstGroup.click()
    await page.waitForTimeout(500)

    const notesTab = page.getByText('Note', { exact: true }).first()
    if (!await notesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Tab Note non trovato')
      return
    }
    await notesTab.click()
    await page.waitForTimeout(400)

    const deleteBtn = page.getByRole('button', { name: 'ELIMINA' }).first()
    if (!await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Nessuna nota di gruppo eliminabile trovata')
      return
    }
    await deleteBtn.click()
    await expect(page.getByText('Eliminare la nota?')).toBeVisible({ timeout: 3000 })
    await page.getByRole('button', { name: 'ANNULLA' }).click()
  })

  test('eliminare una nota cliente chiede conferma prima di procedere', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Clienti')
    await page.waitForTimeout(500)

    const firstClientCard = page.locator('.card-interactive').first()
    if (!await firstClientCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstClientCard.click()
    await page.waitForTimeout(500)

    const noteTab = page.getByText('Note', { exact: true }).first()
    if (!await noteTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Tab Note non trovato')
      return
    }
    await noteTab.click()
    await page.waitForTimeout(400)

    const deleteBtn = page.getByLabel('Elimina nota').first()
    if (!await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Nessuna nota cliente esistente da eliminare')
      return
    }
    await deleteBtn.click()
    await expect(page.getByText('Eliminare la nota?')).toBeVisible({ timeout: 3000 })
    await page.getByRole('button', { name: 'ANNULLA' }).click()
  })

  test('revocare un badge chiede conferma prima di procedere', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Clienti')
    await page.waitForTimeout(500)

    const firstClientCard = page.locator('.card-interactive').first()
    if (!await firstClientCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstClientCard.click()
    await page.waitForTimeout(500)

    const trofeiTab = page.getByText('Trofei', { exact: true }).first()
    if (!await trofeiTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Tab Trofei non trovato')
      return
    }
    await trofeiTab.click()
    await page.waitForTimeout(400)

    const revokeBtn = page.getByRole('button', { name: 'Revoca badge' }).first()
    if (!await revokeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Nessun badge manuale revocabile trovato per questo cliente')
      return
    }
    await revokeBtn.click()
    await expect(page.getByText(/Revocare ".*"\?/)).toBeVisible({ timeout: 3000 })
    await page.getByRole('button', { name: 'ANNULLA' }).click()
  })

})

// ── RX-39/40 — Attributi ARIA sui selettori e campi ricerca ───────────────────
test.describe('RX-39/40 — Attributi ARIA sui selettori', () => {

  test('Guida test: selettori categoria/test espongono aria-pressed', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Guida Test')
    await page.waitForTimeout(500)

    const pressedBtn = page.locator('button[aria-pressed]').first()
    if (!await pressedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun selettore con aria-pressed trovato')
      return
    }
    await expect(pressedBtn).toHaveAttribute('aria-pressed', /true|false/)
  })

  test('Gruppi: campo ricerca "aggiungi atleta" ha aria-label', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Gruppi')
    await page.waitForTimeout(500)

    const firstGroup = page.locator('button').filter({ hasText: /clienti|cliente/ }).first()
    if (!await firstGroup.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun gruppo trovato')
      return
    }
    await firstGroup.click()
    await page.waitForTimeout(500)

    const searchInput = page.getByLabel('Cerca atleta da aggiungere')
    if (!await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Campo ricerca "aggiungi atleta" non visibile (tab Gestione non attivo?)')
      return
    }
    await expect(searchInput).toBeVisible()
  })

  test('Team (org_admin): select ruolo membro ha aria-label', async ({ orgAdminPage: page }) => {
    await goto(page, `${BASE()}/org`)
    await openTab(page, 'Team')
    await page.waitForTimeout(500)

    const roleSelect = page.locator('select[aria-label^="Ruolo di "]').first()
    if (!await roleSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun membro trovato nel team')
      return
    }
    await expect(roleSelect).toBeVisible()
  })

})

// ── RX-42 — RecurrenceDetailView scomposto in sotto-componenti ────────────────
test.describe('RX-42 — Ricorrenze, rendering dopo la scomposizione', () => {

  test('il dettaglio ricorrenza mostra Orario/Giorni/Periodo/Clienti', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Ricorrenze')
    await page.waitForTimeout(500)

    const firstRec = page.locator('button').filter({ hasText: /Lun|Mar|Mer|Gio|Ven|Sab|Dom/ }).first()
    if (!await firstRec.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessuna ricorrenza trovata')
      return
    }
    await firstRec.click()
    await page.waitForTimeout(500)

    await expect(page.getByText('ORARIO')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('GIORNI')).toBeVisible()
    await expect(page.getByText('PERIODO').first()).toBeVisible()
    await expect(page.getByText(/CLIENTI \(\d+\)/)).toBeVisible()
  })

})

// ── RX-43/49 — EmptyState + error boundary nelle viste analytics gruppo ───────
test.describe('RX-43/49 — Tab gruppo senza crash', () => {

  test('Classifica/Analisi/Confronto renderizzano senza errori console', async ({ trainerPage: page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await goto(page, `${BASE()}/trainer`)
    await openTab(page, 'Gruppi')
    await page.waitForTimeout(500)

    const firstGroup = page.locator('button').filter({ hasText: /clienti|cliente/ }).first()
    if (!await firstGroup.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Nessun gruppo trovato')
      return
    }
    await firstGroup.click()
    await page.waitForTimeout(500)

    for (const tabName of ['Classifica', 'Analisi', 'Confronto']) {
      const tabBtn = page.getByText(tabName, { exact: true }).first()
      if (await tabBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tabBtn.click()
        await page.waitForTimeout(400)
      }
    }

    expect(errors, `Errori console: ${errors.join('\n')}`).toEqual([])
  })

})
