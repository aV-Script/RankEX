import {
  launchBrowser, newPage, shot, sleep, login, clickText, clickContains, fillByPlaceholder, BASE_URL,
} from './helpers.mjs'

const BREAKPOINTS = ['mobile', 'tablet', 'desktop']
const EMAIL = 'coach@test.rankex'
const PASSWORD = 'CoachTest1'

async function run(breakpoint) {
  const browser = await launchBrowser()
  const page = await newPage(browser, breakpoint)
  console.log(`\n=== soccer / ${breakpoint} ===`)

  await login(page, BASE_URL, EMAIL, PASSWORD)

  await clickText(page, ['CLIENTI', 'Clienti', 'ALLIEVI', 'Allievi'])
  await sleep(800)
  await shot(page, breakpoint, '01_soccer_clienti_lista')

  const newClientOpened = await clickContains(page, ['+ NUOVO', 'NUOVO'])
  if (newClientOpened) {
    await sleep(700)
    await shot(page, breakpoint, '02_soccer_nuovo_step1')

    await fillByPlaceholder(page, 'Mario Rossi', 'Test Soccer Screenshot')
    const dateInput = await page.$('input[type="date"]')
    if (dateInput) await dateInput.fill('2012-04-10')
    await fillByPlaceholder(page, '70', '45')
    await fillByPlaceholder(page, '175', '150')
    await clickContains(page, ['AVANTI'])
    await sleep(600)
    await shot(page, breakpoint, '03_soccer_nuovo_step2_ruolo')

    await clickContains(page, ['Centrocampista'])
    await sleep(300)
    await clickContains(page, ['AVANTI'])
    await sleep(600)
    await shot(page, breakpoint, '04_soccer_nuovo_step3_account')
  } else {
    console.log('  [SKIP] bottone nuovo allievo non trovato')
  }

  await page.goto(BASE_URL, { waitUntil: 'load' })
  await sleep(2500)
  await clickText(page, ['GUIDA TEST', 'Guida Test'])
  await sleep(800)
  await shot(page, breakpoint, '05_soccer_guida_test')

  await browser.close()
}

for (const bp of BREAKPOINTS) {
  await run(bp).catch(e => console.error(`  [ERROR] ${bp}:`, e.message))
}
console.log('\nSoccer screenshots done.')
