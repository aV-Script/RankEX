import { launchBrowser, newPage, shot, sleep, login, clickText, BASE_URL } from './helpers.mjs'

const BREAKPOINTS = ['mobile', 'tablet', 'desktop']
const EMAIL = 'client@test.rankex'
const PASSWORD = 'ClientTest1'

async function run(breakpoint) {
  const browser = await launchBrowser()
  const page = await newPage(browser, breakpoint)
  console.log(`\n=== client / ${breakpoint} ===`)

  await login(page, BASE_URL, EMAIL, PASSWORD)
  await shot(page, breakpoint, '01_hub_home')

  await clickText(page, ['TEST', 'Test'])
  await shot(page, breakpoint, '02_test_fisici')

  await clickText(page, ['BIA'])
  await shot(page, breakpoint, '03_test_bia')

  await clickText(page, ['TROFEI', 'Trofei'])
  await shot(page, breakpoint, '04_trofei')

  await clickText(page, ['CALENDARIO', 'Calendario'])
  await shot(page, breakpoint, '05_calendario')

  await clickText(page, ['SCHEDA', 'Scheda'])
  await shot(page, breakpoint, '06_scheda')

  await clickText(page, ['PROFILO', 'Profilo'])
  await sleep(600)
  await clickText(page, ['AVATAR', 'Avatar'])
  await shot(page, breakpoint, '07_profilo_avatar')

  await clickText(page, ['NOTE', 'Note'])
  await shot(page, breakpoint, '08_profilo_note')

  await clickText(page, ['ATTIVITÀ', 'Attività', 'ATTIVITA'])
  await shot(page, breakpoint, '09_profilo_attivita')

  await clickText(page, ['MISURE', 'Misure'])
  await shot(page, breakpoint, '10_profilo_misure')

  await clickText(page, ['TEMA', 'Tema'])
  await shot(page, breakpoint, '11_profilo_tema')

  await clickText(page, ['ACCOUNT', 'Account'])
  await shot(page, breakpoint, '12_profilo_account')

  await browser.close()
}

for (const bp of BREAKPOINTS) {
  await run(bp).catch(e => console.error(`  [ERROR] ${bp}:`, e.message))
}
console.log('\nClient screenshots done.')
