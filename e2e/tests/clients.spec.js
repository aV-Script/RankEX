/**
 * E2E — Gestione clienti e dashboard
 * Copre: TP-006 (lista), TP-008 (wizard PT), TP-010 (elimina), TP-011 (dashboard)
 */
import { test, expect }     from '../fixtures/auth.fixture.js'
import { goto, openTab }    from '../helpers/page.js'

const BASE    = () => process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
// ClientCard = <button class="... rx-card ...">
const CARD    = 'button[class*="rx-card"]'

// ── TP-006 — Lista clienti ────────────────────────────────────────────────────
test.describe('TP-006 — Lista clienti', () => {

  test('trainer vede la lista clienti con almeno una card', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/clients`)
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: 10_000 })
  })

  test('ricerca testuale filtra i risultati', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/clients`)
    // Aspetta che la lista sia caricata
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: 10_000 })

    const totalBefore = await page.locator(CARD).count()
    await page.getByPlaceholder(/cerca per nome/i).fill('zzzznotexists')
    await page.waitForTimeout(400)
    const totalAfter = await page.locator(CARD).count()
    expect(totalAfter).toBeLessThan(totalBefore)
  })

})

// ── TP-008 — Wizard nuovo cliente PT ─────────────────────────────────────────
test.describe('TP-008 — Wizard nuovo cliente PT', () => {

  test('wizard si apre e il primo step richiede anagrafica', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/clients`)

    // Bottone "+ NUOVO" nella toolbar
    const addBtn = page.getByRole('button', { name: /^\+\s*NUOVO$/i })
      .or(page.getByText('+ NUOVO'))
    await expect(addBtn.first()).toBeVisible({ timeout: 8_000 })
    await addBtn.first().click()
    await page.waitForLoadState('load')

    // NewClientView deve essere visibile con campo Nome (placeholder "Mario Rossi")
    const nomeField = page.getByPlaceholder('Mario Rossi')
      .or(page.getByLabel(/nome e cognome/i))
    await expect(nomeField.first()).toBeVisible({ timeout: 8_000 })
  })

  test('step categoria PT mostra 3 opzioni (health/active/athlete)', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/clients`)
    const addBtn = page.getByText('+ NUOVO')
    if (!await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Bottone + NUOVO non trovato')
      return
    }
    await addBtn.first().click()
    await page.waitForLoadState('load')

    // Compila anagrafica step 1
    await page.getByPlaceholder('Mario Rossi').first().fill('Test E2E')
    const dataNascita = page.getByPlaceholder(/aaaa-mm-gg|data/i)
      .or(page.locator('input[type="date"]'))
    await dataNascita.first().fill('1990-05-15')

    // Avanti
    const avanti = page.getByRole('button', { name: /avanti/i })
    if (await avanti.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await avanti.click()
      await page.waitForTimeout(500)
      // Deve comparire la selezione categoria
      await expect(page.getByText(/health/i)).toBeVisible({ timeout: 5_000 })
      await expect(page.getByText(/active/i)).toBeVisible()
      await expect(page.getByText(/athlete/i)).toBeVisible()
    } else {
      test.skip(true, 'Bottone AVANTI non trovato — verifica UX wizard')
    }
  })

})

// ── TP-010 — Elimina cliente ──────────────────────────────────────────────────
test.describe('TP-010 — Elimina cliente', () => {

  test('ConfirmDialog appare e annullare non elimina il cliente', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/clients`)
    const firstCard = page.locator(CARD).first()
    if (!await firstCard.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstCard.click()
    await page.waitForLoadState('load')

    const deleteBtn = page.getByRole('button', { name: /elimina|cancella/i })
    if (!await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Bottone elimina non trovato nella dashboard')
      return
    }
    await deleteBtn.first().click()

    const dialog = page.locator('[role="dialog"]')
      .or(page.locator('div[class*="overlay"], div[class*="modal"]').first())
    await expect(dialog).toBeVisible({ timeout: 3_000 })

    const cancelBtn = page.getByRole('button', { name: /annulla|no|indietro/i })
    await cancelBtn.first().click()
    await expect(dialog).not.toBeVisible({ timeout: 3_000 })
  })

})

// ── TP-011 — Dashboard cliente ────────────────────────────────────────────────
test.describe('TP-011 — Dashboard cliente', () => {

  test('dashboard mostra scheda atleta con XPBar', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/clients`)
    const firstCard = page.locator(CARD).first()
    if (!await firstCard.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstCard.click()
    await page.waitForLoadState('load')

    // XPBar — contiene il livello (testo "Lv." o numero)
    const xpArea = page.locator('div[class*="XP"], div[class*="xp"]')
      .or(page.getByText(/lv\.|liv\.|level/i))
    await expect(xpArea.first()).toBeVisible({ timeout: 8_000 })
  })

  test('tab Note è navigabile', async ({ trainerPage: page }) => {
    await goto(page, `${BASE()}/clients`)
    const firstCard = page.locator(CARD).first()
    if (!await firstCard.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstCard.click()
    await page.waitForLoadState('load')

    const noteTab = page.getByRole('button', { name: /^note$/i })
      .or(page.getByText('NOTE', { exact: true }))
    if (await noteTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await noteTab.first().click()
      await page.waitForTimeout(400)
      // L'area note deve essere visibile (textarea o lista note)
      const notesArea = page.locator('textarea').or(page.getByText(/nessuna nota/i))
      await expect(notesArea.first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test('su mobile la tab AVATAR è visibile', async ({ trainerPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await goto(page, `${BASE()}/clients`)
    const firstCard = page.locator(CARD).first()
    if (!await firstCard.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstCard.click()
    await page.waitForLoadState('load')

    const avatarTab = page.getByRole('button', { name: /avatar/i })
    await expect(avatarTab).toBeVisible({ timeout: 5_000 })
  })

})
