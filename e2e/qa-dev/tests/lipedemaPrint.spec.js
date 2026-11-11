/**
 * Layout di stampa del PDF paziente Lipedema su rankex-dev (Sprint #16, BUG-020): paziente E2E-
 * con tre valutazioni a note lunghe e una BIA, report A4 generato con il motore di stampa di
 * Chromium (emulateMedia print + page.pdf). Verifica 2 pagine, margine verticale su entrambe
 * e BIA intera su una pagina (confronto del PDF con e senza la sezione BIA visibile). Paziente cancellato dal teardown (BIA inclusa: sta sul documento).
 */
import { test, expect, e2eName, openClient, dialogButton } from '../fixtures.js'
import { writeFileSync } from 'fs'
import { QA_ORGS, readEnvTest, assertDevFirestore } from '../qaDev.config.js'
import { adminServices } from '../global.setup.js'
import { inspectPdf } from '../pdfInspect.js'

const PATIENT_NAME = e2eName('Stampa')
const LIPEDEMA_ORG_ID = QA_ORGS.lipedema.orgId

// A4 in CSS px (96 dpi) e in punti PDF (72 dpi); margine verticale del report (PRINT_PAGE_MARGIN, 12mm)
const A4_WIDTH_PX      = 794
const A4_HEIGHT_PX     = 1123
const A4_HEIGHT_PT     = 841.89
const MARGIN_MM        = 12
const MM_PER_INCH      = 25.4
const PT_PER_INCH      = 72
const PX_PER_INCH      = 96
const MARGIN_PT        = (MARGIN_MM / MM_PER_INCH) * PT_PER_INCH
const MARGIN_PX        = (MARGIN_MM / MM_PER_INCH) * PX_PER_INCH
const EXPECTED_PAGES   = 2
const CHANGED_PAGES_WITHOUT_BIA = 1
// Tolleranza sul margine (arrotondamenti del motore di stampa)
const MARGIN_TOLERANCE_PT = 2

// Note di 1000 caratteri (limite del campo) fatte di parole, così il testo va a capo
const LONG_NOTE = 'osservazione clinica di test automatico sul percorso e sulla tolleranza allo sforzo '
  .repeat(13).slice(0, 1000).trim()

const BIA_VALUES = {
  date: '11 nov', fatMassPercent: 31.4, muscleMassKg: 41.2, waterPercent: 49.8, boneMassKg: 2.6,
  bmi: 28.3, bmrKcal: 1420, metabolicAge: 41, visceralFat: 7,
}

test.describe.configure({ mode: 'serial' })

test('prepara il paziente: visita con note lunghe e una BIA', async ({ openAs }) => {
  const page = await openAs('lipedema-trainer')
  await page.getByRole('button', { name: '+ NUOVO' }).click()
  await page.locator('#wizard-name').fill(PATIENT_NAME)
  await page.locator('input[type="date"]').first().fill('1984-09-12')
  await page.getByRole('button', { name: 'F', exact: true }).click()
  await page.locator('#wizard-peso').fill('76')
  await page.locator('#wizard-altezza').fill('164')
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.locator('#wizard-privacy-delivered').check()
  await page.locator('#wizard-privacy-version').fill('E2E-1.0')
  await page.locator('#wizard-privacy-date').fill(localDate())
  await page.getByRole('button', { name: 'CREA PAZIENTE' }).last().click()
  await dialogButton(page, 'CREA PAZIENTE').click()
  await expect(page.getByText('Paziente creato')).toBeVisible({ timeout: 60_000 })

  await page.goto('/')
  await openClient(page, PATIENT_NAME)
  await page.getByRole('button', { name: /^valutazioni$/i }).click()
  await page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: /^2MWT/ }).click()

  await expect(page.getByText('1 DI 5')).toBeVisible()
  await page.getByRole('spinbutton', { name: 'TRATTI COMPLETI CONO→CONO' }).fill('4')
  await page.getByRole('spinbutton', { name: 'FRAZIONE FINALE (M)' }).fill('12')
  await fillNotes(page)
  await saveVisitStep(page, 'SALVA E PASSA A 30s-STS')

  await expect(page.getByRole('heading', { name: 'Nuova valutazione · 30s-STS' })).toBeVisible({ timeout: 60_000 })
  await yesNo(page, 'FAMILIARIZZAZIONE ESEGUITA', 'SÌ')
  await page.getByRole('spinbutton', { name: 'RIPETIZIONI COMPLETE' }).fill('11')
  await fillNotes(page)
  await saveVisitStep(page, 'SALVA E PASSA A HANDGRIP')

  await expect(page.getByRole('heading', { name: 'Nuova valutazione · Handgrip' })).toBeVisible({ timeout: 60_000 })
  await page.getByRole('textbox', { name: 'MARCA DINAMOMETRO' }).fill('Jamar')
  await page.getByRole('textbox', { name: 'MODELLO' }).fill('Plus')
  await page.getByRole('textbox', { name: 'IMPUGNATURA' }).fill('2')
  await yesNo(page, 'MANO DOMINANTE', 'DESTRA')
  const newtons = ['220', '190', '226', '195', '218', '192']
  for (let i = 0; i < newtons.length; i++) {
    await page.getByRole('textbox', { name: new RegExp(`^Prova ${i + 1}, mano`) }).fill(newtons[i])
  }
  await fillNotes(page)
  await saveVisitStep(page, 'SALVA E CHIUDI')
  await expect(page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' }).first()).toBeEnabled({ timeout: 60_000 })

  // La BIA di un paziente Lipedema non ha una UI nei test: si scrive come fa salvaBia (lastBia),
  // con l'Admin SDK di rankex-dev, sullo stesso paziente E2E- che il teardown cancella
  const [db] = adminServices(readEnvTest())
  assertDevFirestore(db)
  const clients = await db.collection(`organizations/${LIPEDEMA_ORG_ID}/clients`).where('name', '==', PATIENT_NAME).get()
  expect(clients.size).toBe(1)
  await clients.docs[0].ref.update({ lastBia: BIA_VALUES, biaHistory: [BIA_VALUES] })
})

test('PDF A4: 2 pagine, margine su entrambe, BIA intera su una pagina', async ({ openAs }, testInfo) => {
  const page = await openAs('lipedema-trainer')
  // window.print() neutralizzato prima che l'app lo chiami (anteprima con timer a 350 ms);
  // afterprint intercettato prima del listener dell'app: page.pdf() lo scatena e chiuderebbe
  // l'anteprima, che serve per generare il PDF una seconda volta
  await page.addInitScript(() => {
    window.print = () => {}
    window.addEventListener('afterprint', event => event.stopImmediatePropagation())
  })
  await page.reload()
  await openClient(page, PATIENT_NAME)

  await page.getByRole('button', { name: 'Azioni', exact: true }).click()
  await page.getByRole('button', { name: /esporta pdf/i }).click()
  await expect(page.getByText(/ANTEPRIMA PDF/)).toBeVisible()

  // Layout come in stampa: larghezza A4, regole @media print attive
  await page.setViewportSize({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX })
  await page.emulateMedia({ media: 'print' })
  // Prove di negatività: ogni difetto è iniettato senza toccare il sorgente (solo con '1')
  if (process.env.QA_PRINT_INJECT_MARGIN_0 === '1') {
    testInfo.annotations.push({ type: 'debug', description: 'QA_PRINT_INJECT_MARGIN_0: @page { margin: 0 } iniettato' })
    await page.addStyleTag({ content: '@page { margin: 0 !important; }' })
  }
  if (process.env.QA_PRINT_INJECT_BIA_BREAK === '1') {
    testInfo.annotations.push({ type: 'debug', description: 'QA_PRINT_INJECT_BIA_BREAK: break-inside auto sulla sezione BIA' })
    await page.evaluate(() => {
      const biaSection = [...document.querySelectorAll('#rankex-print-root section')].find(section => /^BIA/.test(section.textContent.trim()))
      biaSection.style.setProperty('break-inside', 'auto', 'important')
    })
  }

  // Struttura del report in stampa, letta prima del PDF
  const layout = await page.evaluate(() => {
    const root       = document.getElementById('rankex-print-root')
    const biaSection = [...root.querySelectorAll('section')].find(section => /^BIA/.test(section.textContent.trim()))
    const testTable  = root.querySelector('section table')
    return {
      hasBia:         Boolean(biaSection),
      biaBreakInside: biaSection ? getComputedStyle(biaSection).breakInside : null,
      biaHeight:      biaSection?.getBoundingClientRect().height ?? 0,
      testBodies:     [...(testTable?.querySelectorAll('tbody') ?? [])].map(body => getComputedStyle(body).breakInside),
    }
  })

  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true })
  writeFileSync(testInfo.outputPath('report-lipedema.pdf'), pdf)
  const inspected = inspectPdf(pdf)

  // Stesso layout con la sezione BIA invisibile: cambia solo il contenuto delle pagine che la ospitano
  await page.evaluate(() => {
    const biaSection = [...document.querySelectorAll('#rankex-print-root section')].find(section => /^BIA/.test(section.textContent.trim()))
    biaSection.style.visibility = 'hidden'
  })
  const inspectedWithoutBia = inspectPdf(await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true }))

  // (a) esattamente 2 pagine, con e senza BIA visibile (la visibilità non cambia il layout)
  expect(inspected.pages.length, 'pagine del PDF').toBe(EXPECTED_PAGES)
  expect(inspectedWithoutBia.pages.length, 'pagine del PDF con BIA nascosta').toBe(EXPECTED_PAGES)

  // (b) margine verticale su ENTRAMBE le pagine: l'area di stampa di ogni pagina del PDF
  // (clip del contenuto) dista dai bordi del foglio almeno quanto @page { margin: 12mm 0 }
  for (const [index, pageInfo] of inspected.pages.entries()) {
    expect(pageInfo.height).toBeCloseTo(A4_HEIGHT_PT, 0)
    expect(pageInfo.contentTop, `pagina ${index + 1}: margine alto`).toBeGreaterThanOrEqual(MARGIN_PT - MARGIN_TOLERANCE_PT)
    expect(pageInfo.height - pageInfo.contentBottom, `pagina ${index + 1}: margine basso`).toBeGreaterThanOrEqual(MARGIN_PT - MARGIN_TOLERANCE_PT)
  }

  // (c) BIA intera su UNA pagina: nascondendola cambia il contenuto di una sola pagina (se fosse
  // a cavallo del salto ne cambierebbero due)
  const changedPages = inspected.pages.flatMap((pageInfo, index) =>
    pageInfo.contentHash === inspectedWithoutBia.pages[index]?.contentHash ? [] : [index + 1])
  expect(changedPages, 'pagine che ospitano la BIA').toHaveLength(CHANGED_PAGES_WITHOUT_BIA)

  // ...e il meccanismo che lo garantisce: break-inside avoid su BIA e su ogni test (tbody)
  expect(layout.hasBia, 'sezione BIA nel report').toBe(true)
  expect(layout.biaBreakInside).toBe('avoid')
  expect(layout.biaHeight).toBeLessThan(A4_HEIGHT_PX - 2 * MARGIN_PX)
  expect(layout.testBodies, 'tbody dei 5 test').toHaveLength(5)
  expect(layout.testBodies.every(value => value === 'avoid')).toBe(true)
})

// ── helper ────────────────────────────────────────────────────────────────────

async function fillNotes(page) {
  await page.getByRole('textbox', { name: /^NOTE \(FACOLTATIVE/i }).fill(LONG_NOTE)
}

async function saveVisitStep(page, buttonName) {
  await page.getByRole('button', { name: buttonName, exact: true }).click()
  await dialogButton(page, 'SALVA').click()
}

async function yesNo(page, label, option) {
  await page.getByText(label, { exact: true }).locator('xpath=..').getByRole('button', { name: option, exact: true }).click()
}

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
