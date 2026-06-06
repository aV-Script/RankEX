/**
 * E2E — Mobile smoke test
 * Verifica i flussi critici su viewport mobile (iPhone 14).
 * Eseguito solo nel progetto "mobile" di Playwright.
 */
import { test, expect }  from '../fixtures/auth.fixture.js'
import { goto }          from '../helpers/page.js'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

test.use({ viewport: { width: 390, height: 844 } }) // iPhone 14

test.describe('Mobile — flussi critici', () => {

  test('login funziona su mobile', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /accedi/i })).toBeVisible()
  })

  test('lista clienti scrollabile su mobile', async ({ trainerPage: page }) => {
    await goto(page, `${BASE}/clients`)
    const cards = page.locator('button[class*="rx-card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10_000 })
  })

  test('tab AVATAR visibile su mobile nella dashboard cliente', async ({ trainerPage: page }) => {
    await goto(page, `${BASE}/clients`)
    const firstCard = page.locator('button[class*="rx-card"]').first()
    if (!await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Nessun cliente trovato')
      return
    }
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    const avatarTab = page.getByRole('button', { name: /avatar/i })
    await expect(avatarTab).toBeVisible({ timeout: 8_000 })
  })

  test('MobileNav è visibile (bottom navigation)', async ({ trainerPage: page }) => {
    await goto(page, `${BASE}/`)
    const mobileNav = page.locator('[class*="MobileNav"], nav[class*="mobile"]')
      .or(page.locator('nav').filter({ has: page.locator('a, button') }).last())
    await expect(mobileNav).toBeVisible({ timeout: 5_000 })
  })

})
