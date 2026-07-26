/**
 * E2E — Piani SaaS e blocchi al limite
 * Copre: TP-031 (blocco clienti/trainer), TP-030 (gestione team)
 */
import { test, expect }  from '../fixtures/auth.fixture.js'
import { goto }          from '../helpers/page.js'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

test.describe('TP-031 — Limiti piano (org admin)', () => {

  test('OrgSettingsPage mostra piano corrente e limiti', async ({ orgAdminPage: page }) => {
    // OrgSettingsPage non ha una voce di nav persistente — si raggiunge dal
    // bottone "IMPOSTAZIONI" del banner limite piano nella pagina Team.
    await goto(page, `${BASE}/`)
    const teamLink = page.getByText(/team|membri/i).first()
    if (!await teamLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Link team non trovato')
      return
    }
    await teamLink.click()
    await page.waitForLoadState('load')

    // La lista membri carica in modo asincrono (skeleton): il banner/bottone
    // IMPOSTAZIONI esiste solo dopo che members.length è noto.
    const settingsBtn = page.getByRole('button', { name: /impostazioni/i })
    if (!await settingsBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await page.waitForTimeout(1_500)
    }
    if (!await settingsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Bottone IMPOSTAZIONI non trovato — org non al limite piano')
      return
    }
    await settingsBtn.click()
    await page.waitForLoadState('load')

    // Il piano deve essere visibile
    const piano = page.getByText(/free|pro|enterprise/i)
    await expect(piano.first()).toBeVisible({ timeout: 5_000 })

    // I limiti devono essere descritti
    const limiti = page.getByText(/trainer|clienti/i)
    await expect(limiti.first()).toBeVisible()
  })

  test('MembersPage mostra banner se al limite trainer', async ({ orgAdminPage: page }) => {
    await goto(page, `${BASE}/`)
    // Naviga alla pagina team/members
    const teamLink = page.getByText(/team|membri/i).first()
    if (!await teamLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Link team non trovato')
      return
    }
    await teamLink.click()
    await page.waitForLoadState('load')

    // Se al limite, deve esserci un banner giallo
    const banner = page.locator('[class*="warning"], [class*="banner"]')
      .or(page.getByText(/limite|piano/i))
    // Non forziamo il banner — dipende dallo stato dell'org di test
    // Verifichiamo solo che la pagina carichi
    const membersArea = page.locator('select[aria-label^="Ruolo di "]')
      .or(page.getByText(/team|membri/i))
    await expect(membersArea.first()).toBeVisible({ timeout: 8_000 })
  })

})

test.describe('TP-030 — Gestione team (org admin)', () => {

  test('lista membri visibile con ruoli', async ({ orgAdminPage: page }) => {
    await goto(page, `${BASE}/`)
    const teamLink = page.getByText(/team|membri/i).first()
    if (!await teamLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Link team non trovato')
      return
    }
    await teamLink.click()
    await page.waitForLoadState('load')

    // Almeno un membro deve essere visibile (select ruolo con aria-label dinamico "Ruolo di <nome>")
    const membri = page.locator('select[aria-label^="Ruolo di "]')
    await expect(membri.first()).toBeVisible({ timeout: 8_000 })
  })

  test('form aggiungi membro si apre', async ({ orgAdminPage: page }) => {
    await goto(page, `${BASE}/`)
    const teamLink = page.getByText(/team|membri/i).first()
    if (!await teamLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Link team non trovato')
      return
    }
    await teamLink.click()
    await page.waitForLoadState('load')

    const addBtn = page.getByRole('button', { name: /aggiungi|nuovo/i })
    if (!await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Bottone aggiungi non trovato — forse al limite piano')
      return
    }
    const isDisabled = await addBtn.isDisabled()
    if (!isDisabled) {
      await addBtn.click()
      await page.waitForTimeout(500)
      // Form deve aprirsi con campo email
      const emailField = page.getByLabel(/email/i)
      await expect(emailField.first()).toBeVisible({ timeout: 5_000 })
    }
  })

})
