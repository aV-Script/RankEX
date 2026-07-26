import { launchBrowser, newPage, shot, sleep, clickText, clickContains, BASE_URL } from './helpers.mjs'

const BREAKPOINTS = ['mobile', 'tablet', 'desktop']

async function run(breakpoint) {
  const browser = await launchBrowser()
  const page = await newPage(browser, breakpoint)
  console.log(`\n=== auth / ${breakpoint} ===`)

  // 1. Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await sleep(1500)
  await shot(page, breakpoint, '01_login')

  // 2. Reset password — link "password dimenticata"
  const resetClicked = await clickContains(page, ['password dimenticata', 'recupera', 'reset'])
  if (resetClicked) {
    await sleep(500)
    await shot(page, breakpoint, '02_reset_password')
  } else {
    console.log('  [SKIP] reset password link not found')
  }

  // 3. Cambio password obbligatorio — login con account mustChangePassword
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await sleep(1000)
  const emailInput = await page.$('input[type="email"], input[name="email"]')
  const passInput  = await page.$('input[type="password"]')
  if (emailInput && passInput) {
    await emailInput.fill('mustchange@test.rankex')
    await passInput.fill('MustChange1')
    const submitBtn = await page.$('button[type="submit"], button:has-text("Accedi")')
    if (submitBtn) {
      await submitBtn.click()
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
      await sleep(2000)
      await shot(page, breakpoint, '03_cambio_password_obbligatorio')
    }
  }

  await browser.close()
}

for (const bp of BREAKPOINTS) {
  await run(bp)
}
console.log('\nAuth screenshots done.')
