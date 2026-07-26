import {
  launchBrowser, newPage, shot, sleep, login, clickText, clickContains,
  clickTextBelow, clickSlotEvent, fillByPlaceholder, closeModal, BASE_URL,
} from './helpers.mjs'

const BREAKPOINTS = ['mobile', 'tablet', 'desktop']
const EMAIL = 'orgadmin@test.rankex'
const PASSWORD = 'OrgAdminTest1'

async function run(breakpoint) {
  const browser = await launchBrowser()
  const page = await newPage(browser, breakpoint)
  console.log(`\n=== trainer / ${breakpoint} ===`)

  await login(page, BASE_URL, EMAIL, PASSWORD)

  // ── Clienti ──────────────────────────────────────────────────────────────
  await clickText(page, ['CLIENTI', 'Clienti'])
  await sleep(800)
  await shot(page, breakpoint, '01_clienti_lista')

  // Nuovo cliente wizard — compilato per vedere gli step reali
  const newClientOpened = await clickContains(page, ['+ NUOVO', 'NUOVO'])
  if (newClientOpened) {
    await sleep(700)
    await shot(page, breakpoint, '02_nuovo_cliente_step1')

    await fillByPlaceholder(page, 'Mario Rossi', 'Test Screenshot')
    const dateInput = await page.$('input[type="date"]')
    if (dateInput) await dateInput.fill('2000-05-15')
    await fillByPlaceholder(page, '70', '75')
    await fillByPlaceholder(page, '175', '180')
    await clickContains(page, ['AVANTI'])
    await sleep(600)
    await shot(page, breakpoint, '03_nuovo_cliente_step2_categoria')

    await clickContains(page, ['Active'])
    await sleep(300)
    await clickContains(page, ['AVANTI'])
    await sleep(600)
    await shot(page, breakpoint, '04_nuovo_cliente_step3_profilo')
  } else {
    console.log('  [SKIP] pulsante nuovo cliente non trovato')
  }

  // ── ClientDashboard di un cliente esistente ─────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'load' })
  await sleep(2500)
  await clickText(page, ['CLIENTI', 'Clienti'])
  await sleep(800)
  const openedClient = await clickContains(page, ['Mario Rossi'])
  if (openedClient) {
    await sleep(1000)
    await shot(page, breakpoint, '05_client_dashboard_atleta')

    // Le sotto-tab locali condividono testo con la nav principale (CALENDARIO,
    // NOTE...) — clickTextBelow le isola per posizione verticale (sotto la
    // nav globale, sopra il contenuto/bottom-nav). minY=40: la sub-tab bar
    // locale inizia subito sotto l'header globale (~48px), la nav globale
    // stessa parte da top=0 — 40 separa in modo sicuro le due fasce.
    const subtab = async (patterns, name) => {
      const clicked = await clickTextBelow(page, patterns, 40)
      if (!clicked) console.log(`  [SKIP] sub-tab non trovata: ${patterns[0]}`)
      await shot(page, breakpoint, name)
    }
    await subtab(['TEST', 'Test'], '06_client_dashboard_test')
    await subtab(['BIA'], '07_client_dashboard_bia')
    await subtab(['ALLENAMENTO', 'Allenamento'], '07b_client_dashboard_scheda')
    await subtab(['CALENDARIO', 'Calendario'], '08_client_dashboard_calendario')
    await subtab(['NOTE', 'Note'], '09_client_dashboard_note')
    await subtab(['ATTIVITÀ', 'Attività', 'ATTIVITA'], '10_client_dashboard_attivita')
    await subtab(['MISURE', 'Misure'], '10b_client_dashboard_misure')
    await subtab(['TROFEI', 'Trofei'], '10c_client_dashboard_trofei')

    // Campionamento — sul tab TEST
    const testClicked = await clickTextBelow(page, ['TEST', 'Test'], 40)
    if (!testClicked) console.log('  [SKIP] tab TEST non trovata (pre-campionamento)')
    await sleep(1000)
    const campOpened = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button')
      for (const b of buttons) {
        if ((b.textContent || '').trim().toUpperCase().includes('CAMPIONAMENTO')) {
          b.click()
          return true
        }
      }
      return false
    })
    if (campOpened) {
      await sleep(800)
      await shot(page, breakpoint, '11_campionamento_form')
      await closeModal(page)
      await sleep(400)
    } else {
      console.log('  [SKIP] bottone campionamento non trovato')
    }
  } else {
    console.log('  [SKIP] Mario Rossi non trovato in lista')
  }

  // ── Gruppi ───────────────────────────────────────────────────────────────
  await clickText(page, ['GRUPPI', 'Gruppi'])
  await sleep(800)
  await shot(page, breakpoint, '13_gruppi_lista')

  const openedGroup = await clickContains(page, ['Test 3'])
  if (openedGroup) {
    await sleep(800)
    await shot(page, breakpoint, '14_gruppo_gestione')

    await clickText(page, ['CLASSIFICA', 'Classifica'])
    await shot(page, breakpoint, '15_gruppo_classifica')

    await clickText(page, ['ANALISI', 'Analisi'])
    await shot(page, breakpoint, '16_gruppo_analisi')

    await clickText(page, ['CONFRONTO', 'Confronto'])
    await shot(page, breakpoint, '17_gruppo_confronto')

    await clickText(page, ['SESSIONI', 'Sessioni'])
    await shot(page, breakpoint, '18_gruppo_sessioni')

    await clickText(page, ['NOTE', 'Note'])
    await shot(page, breakpoint, '19_gruppo_note')
  } else {
    console.log('  [SKIP] gruppo Test 3 non trovato')
  }

  // ── Calendario (vista trainer) ──────────────────────────────────────────
  await clickText(page, ['CALENDARIO', 'Calendario'])
  await sleep(1000)
  await shot(page, breakpoint, '20_calendario_settimana')

  // Switcher vista è M/S/G (singole lettere, non parole) — vedi CalendarHeader.jsx
  await clickText(page, ['M'])
  await sleep(700)
  await shot(page, breakpoint, '21_calendario_mese')

  await clickText(page, ['G'])
  await sleep(700)
  await shot(page, breakpoint, '22_calendario_giorno')

  const addSlotOpened = await clickContains(page, ['+ Sessione', '+ SESSIONE'])
  if (addSlotOpened) {
    await sleep(700)
    await shot(page, breakpoint, '23_modal_nuova_sessione')
    await closeModal(page)
    await sleep(400)
  } else {
    console.log('  [SKIP] bottone + Sessione non trovato')
  }

  const addRecurrenceOpened = await clickContains(page, ['+ Ricorrenza', '+ RICORRENZA'])
  if (addRecurrenceOpened) {
    await sleep(700)
    await shot(page, breakpoint, '23b_modal_nuova_ricorrenza')
    await closeModal(page)
    await sleep(600)
  } else {
    console.log('  [SKIP] bottone + Ricorrenza non trovato')
  }

  const slotClicked = await clickSlotEvent(page)
  if (slotClicked) {
    await shot(page, breakpoint, '24_slot_popup')
  } else {
    console.log('  [SKIP] nessuno slot cliccabile trovato in vista settimana')
  }
  await closeModal(page)
  await sleep(300)

  // ── Ricorrenze ───────────────────────────────────────────────────────────
  await clickText(page, ['RICORRENZE', 'Ricorrenze'])
  await sleep(800)
  await shot(page, breakpoint, '25_ricorrenze_lista')

  const openedRecurrence = await clickContains(page, ['Andrea Vitolo, Mario Rossi', 'Mario Rossi'])
  if (openedRecurrence) {
    await sleep(700)
    await shot(page, breakpoint, '25b_ricorrenza_dettaglio')
  } else {
    console.log('  [SKIP] dettaglio ricorrenza non trovato')
  }

  // ── Guida Test ───────────────────────────────────────────────────────────
  await clickText(page, ['GUIDA TEST', 'Guida Test'])
  await sleep(800)
  await shot(page, breakpoint, '26_guida_test')

  // ── Profilo trainer ──────────────────────────────────────────────────────
  await clickText(page, ['PROFILO', 'Profilo'])
  await sleep(800)
  await shot(page, breakpoint, '27_profilo_trainer')

  // ── Org_admin extra: Team ───────────────────────────────────────────────
  await clickText(page, ['TEAM', 'Team'])
  await sleep(800)
  await shot(page, breakpoint, '28_team_membri')

  await browser.close()
}

for (const bp of BREAKPOINTS) {
  await run(bp).catch(e => console.error(`  [ERROR] ${bp}:`, e.message))
}
console.log('\nTrainer screenshots done.')
