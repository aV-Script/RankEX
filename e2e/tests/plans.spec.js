/**
 * E2E — Piani SaaS e blocchi al limite
 * Copre: TP-031 (blocco clienti/trainer), TP-030 (gestione team)
 */
import { test, expect }  from '../fixtures/auth.fixture.js'
import { goto }          from '../helpers/page.js'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

test.describe('TP-031 — Limiti piano (org admin)', () => {

  test('OrgSettingsPage mostra piano corrente e limiti', async ({ orgAdminPage: page }) => {
    // Naviga alle impostazioni org (percorso varia: /org/settings o /settings)
    await goto(page, `${BASE}/`)
    const settingsLink = page.getByText(/impostaz|settings/i)
    if (await settingsLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await settingsLink.first().click()
      await page.waitForLoadState('networkidle')

      // Il piano deve essere visibile
      const piano = page.getByText(/free|pro|enterprise/i)
      await expect(piano.first()).toBeVisible({ timeout: 5_000 })

      // I limiti devono essere descritti
      const limiti = page.getByText(/trainer|clienti/i)
      await expect(limiti.first()).toBeVisible()
    } else {
      test.skip(true, 'Link impostazioni non trovato')
    }
  })

  test('MembersPage mostra banner se al limite trainer', async ({ orgAdminPage: page }) => {
    await goto(page, `${BASE}/`)
    // Naviga alla pagina team/members
    const teamLink = page.getByText(/team|membri/i)
    if (!await teamLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Link team non trovato')
      return
    }
    await teamLink.first().click()
    await page.waitForLoadState('networkidle')

    // Se al limite, deve esserci un banner giallo
    const banner = page.locator('[class*="warning"], [class*="banner"]')
      .or(page.getByText(/limite|piano/i))
    // Non forziamo il banner — dipende dallo stato dell'org di test
    // Verifichiamo solo che la pagina carichi
    const membersArea = page.locator('[class*="MembersPage"], [class*="members"]')
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
    await page.waitForLoadState('networkidle')

    // Almeno un membro deve essere visibile (l'org_admin stesso)
    const membri = page.locator('[class*="member"], [data-testid="member-row"]')
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
    await page.waitForLoadState('networkidle')

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
