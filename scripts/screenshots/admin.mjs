import { launchBrowser, newPage, shot, sleep, login, clickText, clickContains, clickNavLabel, closeModal, ADMIN_URL } from './helpers.mjs'

const BREAKPOINTS = ['mobile', 'tablet', 'desktop']
const EMAIL = 'superadmin@rankex.dev.it'
const PASSWORD = 'superadmin26!'

async function run(breakpoint) {
  const browser = await launchBrowser()
  const page = await newPage(browser, breakpoint)
  console.log(`\n=== admin / ${breakpoint} ===`)

  await login(page, ADMIN_URL, EMAIL, PASSWORD)
  await shot(page, breakpoint, '01_dashboard')

  const orgsClicked = await clickNavLabel(page, 'Organizzazioni')
  if (!orgsClicked) console.log('  [SKIP] click Organizzazioni fallito')
  await sleep(1000)
  await shot(page, breakpoint, '02_orgs_lista')

  const newOrgOpened = await clickContains(page, ['NUOVA', 'Nuova'])
  if (newOrgOpened) {
    await sleep(700)
    await shot(page, breakpoint, '03_modal_nuova_org')
    await closeModal(page)
    await sleep(400)
  } else {
    console.log('  [SKIP] bottone nuova org non trovato')
  }

  const openedOrg = await clickContains(page, ['Test Org PT', 'test-org-pt'])
  if (openedOrg) {
    await sleep(800)
    await shot(page, breakpoint, '04_org_detail')
  } else {
    console.log('  [SKIP] org test-org-pt non trovata in lista')
  }

  // Reload pulito per ripartire dalla dashboard prima di andare al profilo
  await page.goto(ADMIN_URL, { waitUntil: 'load' })
  await sleep(2500)
  const profileClicked = await clickNavLabel(page, 'Profilo')
  if (!profileClicked) console.log('  [SKIP] click Profilo fallito')
  await sleep(1000)
  await shot(page, breakpoint, '05_profilo_superadmin')

  await browser.close()
}

for (const bp of BREAKPOINTS) {
  await run(bp).catch(e => console.error(`  [ERROR] ${bp}:`, e.message))
}
console.log('\nAdmin screenshots done.')
