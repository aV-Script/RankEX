// UX validation: pentagon nav + theme system (localhost)
import { chromium } from '@playwright/test'
import { mkdir }    from 'fs/promises'
import path         from 'path'

const OUT   = path.resolve('scripts/ux-screenshots')
const URL   = 'http://localhost:5175'
const EMAIL = 'client@test.rankex'
const PASS  = 'ClientTest1'

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page    = await ctx.newPage()

const errs = []
page.on('pageerror', e => errs.push(e.message))

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) })
  console.log(`📸  ${name}`)
}

// ── 1. Login ─────────────────────────────────────────────────────────────────

await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForSelector('#login-email', { timeout: 10000 })
await shot('01-login')

await page.fill('#login-email', EMAIL)
await page.fill('#login-password', PASS)
await page.click('button[type="submit"]')

// Aspetta hub (polygon svg o nome cliente)
await page.waitForSelector('svg polygon', { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(2000)
await shot('02-hub-mobile-pentagon')

// ── 2. Dettaglio pentagono ────────────────────────────────────────────────────

// Screenshot centrato sul pentagono
await shot('03-hub-full')

// ── 3. Naviga a Test ─────────────────────────────────────────────────────────

const testBtn = page.locator('button').filter({ hasText: /^Test$/ }).first()
if (await testBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await testBtn.click()
  await page.waitForTimeout(1500)
  await shot('04-section-test')
} else {
  console.log('⚠️  Test button not visible')
  await shot('04-section-test-missing')
}

// ── 4. Bottom nav ─────────────────────────────────────────────────────────────

await shot('05-bottom-nav')

// ── 5. Trofei ────────────────────────────────────────────────────────────────

const trofeiBtn = page.locator('nav.fixed').locator('button').filter({ hasText: /Trofei/ }).first()
if (await trofeiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await trofeiBtn.click()
  await page.waitForTimeout(1500)
  await shot('06-section-trofei')
}

// ── 6. Calendario ────────────────────────────────────────────────────────────

const calBtn = page.locator('nav.fixed').locator('button').filter({ hasText: /Calendario/ }).first()
if (await calBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await calBtn.click()
  await page.waitForTimeout(1500)
  await shot('07-section-calendario')
}

// ── 7. Torna Home (avatar center button nel bottom nav) ───────────────────────

// Il bottom nav è "nav.fixed.bottom-0" — il 3° button (index 2) è l'avatar home
const bottomNavBtns = page.locator('nav.fixed.bottom-0 button')
const homeBtn = bottomNavBtns.nth(2)
if (await homeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await homeBtn.click()
  await page.waitForTimeout(1500)
  await shot('08-hub-home-return')
} else {
  // fallback: cerca via bottom-0 class
  console.log('⚠️  Home button via bottom nav not found, trying alternative')
  await shot('08-hub-home-return-missing')
}

// ── 8. Profilo ────────────────────────────────────────────────────────────────

const profiloBtn = page.locator('button').filter({ hasText: /^Profilo$/ }).first()
if (await profiloBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await profiloBtn.click()
  await page.waitForTimeout(1200)
  await shot('09-profilo-avatar-subtab')
}

// ── 9. Sub-tab Tema ───────────────────────────────────────────────────────────

const temaBtn = page.locator('button').filter({ hasText: /^Tema$/ }).first()
if (await temaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await temaBtn.click()
  await page.waitForTimeout(800)
  await shot('10-profilo-tema-subtab')
}

// ── 10. Cambio tema: Midnight ─────────────────────────────────────────────────

const midBtn = page.locator('button').filter({ hasText: /Midnight/ }).first()
if (await midBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await midBtn.click()
  await page.waitForTimeout(800)
  await shot('11-tema-midnight')
} else {
  console.log('⚠️  Midnight not found')
  await shot('11-tema-midnight-missing')
}

// ── 11. Carbon ────────────────────────────────────────────────────────────────

const carbonBtn = page.locator('button').filter({ hasText: /Carbon/ }).first()
if (await carbonBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await carbonBtn.click()
  await page.waitForTimeout(800)
  await shot('12-tema-carbon')
}

// ── 12. Violet ────────────────────────────────────────────────────────────────

const violetBtn = page.locator('button').filter({ hasText: /Violet/ }).first()
if (await violetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await violetBtn.click()
  await page.waitForTimeout(800)
  await shot('13-tema-violet')
}

// ── 13. Steel ─────────────────────────────────────────────────────────────────

const steelBtn = page.locator('button').filter({ hasText: /Steel/ }).first()
if (await steelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await steelBtn.click()
  await page.waitForTimeout(800)
  await shot('14-tema-steel')
}

// Ripristina RankEX
const rankexBtn = page.locator('button').filter({ hasText: /RankEX/ }).first()
if (await rankexBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await rankexBtn.click()
  await page.waitForTimeout(600)
}

// ── 14. Desktop: hub + top nav ───────────────────────────────────────────────

await page.setViewportSize({ width: 1280, height: 800 })
await page.waitForTimeout(800)
await shot('15-desktop-hub')

// Naviga a Test su desktop → vedi top nav
const testBtnDsk = page.locator('button').filter({ hasText: /^Test$/ }).first()
if (await testBtnDsk.isVisible({ timeout: 3000 }).catch(() => false)) {
  await testBtnDsk.click()
  await page.waitForTimeout(1000)
  await shot('16-desktop-test-topnav')
}

// Profilo desktop → Tema
const profiloBtnDsk = page.locator('button').filter({ hasText: /^Profilo$/ }).first()
if (await profiloBtnDsk.isVisible({ timeout: 3000 }).catch(() => false)) {
  await profiloBtnDsk.click()
  await page.waitForTimeout(800)
  const temaBtnDsk = page.locator('button').filter({ hasText: /^Tema$/ }).first()
  if (await temaBtnDsk.isVisible({ timeout: 2000 }).catch(() => false)) {
    await temaBtnDsk.click()
    await page.waitForTimeout(600)
    await shot('17-desktop-profilo-tema')
  }
}

// ── 15. ThemeDevPanel (Ctrl+Shift+T — solo in dev) ────────────────────────────

await page.keyboard.press('Control+Shift+T')
await page.waitForTimeout(800)
await shot('18-theme-dev-panel')

// ── Report errori ─────────────────────────────────────────────────────────────

if (errs.length) console.log('\n❌ JS errors:\n', errs.slice(0, 5).join('\n'))
else             console.log('\n✅ No JS errors')

await browser.close()
console.log(`\n→ ${OUT}`)
