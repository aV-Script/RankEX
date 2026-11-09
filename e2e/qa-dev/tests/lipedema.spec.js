/**
 * Lipedema su rankex-dev (STORY-041): nuovo paziente con informativa, visita con
 * 2MWT, 30s-STS e Handgrip, correzione e annullamento, chiusura di un appuntamento,
 * sola lettura dello staff. Paziente E2E- cancellato dal teardown (con le valutazioni,
 * immutabili dal client).
 */
import { test, expect, e2eName, openClient, dialogButton } from '../fixtures.js'

const PATIENT_NAME = e2eName('Paziente')

test.describe.configure({ mode: 'serial' })

test('professionista crea una paziente con informativa', async ({ openAs }) => {
  const page = await openAs('lipedema-trainer')
  await page.getByRole('button', { name: '+ NUOVO' }).click()

  await page.locator('#wizard-name').fill(PATIENT_NAME)
  await page.locator('input[type="date"]').first().fill('1984-09-12')
  await page.getByRole('button', { name: 'F', exact: true }).click()
  await page.locator('#wizard-peso').fill('76')
  await page.locator('#wizard-altezza').fill('164')
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.getByRole('button', { name: /avanti/i }).click()            // email facoltativa
  await page.locator('#wizard-privacy-delivered').check()
  await page.locator('#wizard-privacy-version').fill('E2E-1.0')
  await page.locator('#wizard-privacy-date').fill(localDate())
  await page.getByRole('button', { name: 'CREA PAZIENTE' }).last().click()
  await dialogButton(page, 'CREA PAZIENTE').click()

  await expect(page.getByText('Paziente creato')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(PATIENT_NAME).first()).toBeVisible()
})

test('visita: 2MWT, 30s-STS e Handgrip in sequenza', async ({ openAs }) => {
  const page = await openAs('lipedema-trainer')
  await openClient(page, PATIENT_NAME)
  await page.getByRole('button', { name: /^valutazioni$/i }).click()
  await page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: /^2MWT/ }).click()

  // 2MWT
  await expect(page.getByText('1 DI 5')).toBeVisible()
  await page.getByRole('spinbutton', { name: 'TRATTI COMPLETI CONO→CONO' }).fill('4')
  await page.getByRole('spinbutton', { name: 'FRAZIONE FINALE (M)' }).fill('12')
  await saveVisitStep(page, 'SALVA E PASSA A 30s-STS')

  // 30s-STS
  await expect(page.getByRole('heading', { name: 'Nuova valutazione · 30s-STS' })).toBeVisible({ timeout: 60_000 })
  await yesNo(page, 'FAMILIARIZZAZIONE ESEGUITA', 'SÌ')
  await page.getByRole('spinbutton', { name: 'RIPETIZIONI COMPLETE' }).fill('11')
  await saveVisitStep(page, 'SALVA E PASSA A HANDGRIP')

  // Handgrip, prima volta: nessun setup precompilato
  await expect(page.getByRole('heading', { name: 'Nuova valutazione · Handgrip' })).toBeVisible({ timeout: 60_000 })
  await page.getByRole('textbox', { name: 'MARCA DINAMOMETRO' }).fill('Jamar')
  await page.getByRole('textbox', { name: 'MODELLO' }).fill('Plus')
  await page.getByRole('textbox', { name: 'IMPUGNATURA' }).fill('2')
  await yesNo(page, 'MANO DOMINANTE', 'DESTRA')
  const newtons = ['220', '190', '226', '195', '218', '192']
  for (let i = 0; i < newtons.length; i++) {
    await page.getByRole('textbox', { name: new RegExp(`^Prova ${i + 1}, mano`) }).fill(newtons[i])
  }
  await saveVisitStep(page, 'SALVA E CHIUDI')

  await expect(page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' }).first()).toBeEnabled({ timeout: 60_000 })
  // Un test alla volta (ADR-019): ogni riga si legge nella sua scheda
  await openTestTab(page, '2MWT')
  await expect(page.getByRole('button', { name: /132 m/ })).toBeVisible()          // 4 tratti × 30 m + 12 m
  await expect(page.getByRole('button', { name: /percorso 30 m · nessun ausilio · protocollo 1\.0/ })).toBeVisible()
  await openTestTab(page, '30s-STS')
  await expect(page.getByRole('button', { name: /11 rip\./ })).toBeVisible()
  await openTestTab(page, 'Handgrip')
  await expect(page.getByRole('button', { name: /D 226 · S 195 N/ })).toBeVisible()
})

test('correzione del 2MWT e annullamento del 30s-STS', async ({ openAs }) => {
  const page = await openAs('lipedema-trainer')
  await openClient(page, PATIENT_NAME)
  await page.getByRole('button', { name: /^valutazioni$/i }).click()

  await openTestTab(page, '2MWT')
  await page.getByRole('button', { name: /132 m/ }).click()
  await dialogButton(page, 'CORREGGI').click()
  await page.getByRole('spinbutton', { name: 'TRATTI COMPLETI CONO→CONO' }).fill('5')
  await page.getByRole('button', { name: 'SALVA VALUTAZIONE' }).first().click()
  await page.getByRole('textbox', { name: 'MOTIVO DELLA CORREZIONE' }).fill('E2E: tratti contati male')
  await dialogButton(page, 'SALVA').click()
  await expect(page.getByText('Valutazione corretta')).toBeVisible({ timeout: 60_000 })
  await openTestTab(page, '2MWT')
  await expect(page.getByRole('button', { name: /162 m/ })).toBeVisible()          // 5 × 30 + 12
  await expect(page.getByText('Motivo: E2E: tratti contati male')).toBeVisible()

  await openTestTab(page, '30s-STS')
  await page.getByRole('button', { name: /11 rip\./ }).click()
  await dialogButton(page, 'ANNULLA VALUTAZIONE').click()
  const voidDialog = page.getByRole('dialog').last()
  await voidDialog.getByRole('textbox').fill('E2E: inserita sulla paziente sbagliata')
  await voidDialog.getByRole('button', { name: /^ANNULLA VALUTAZIONE$/ }).click()
  await openTestTab(page, '30s-STS')
  await expect(page.getByText('Motivo: E2E: inserita sulla paziente sbagliata')).toBeVisible({ timeout: 60_000 })
})

test('professionista chiude un appuntamento', async ({ openAs }) => {
  const page   = await openAs('lipedema-trainer')
  const minute = String(new Date().getMinutes()).padStart(2, '0')

  await page.getByRole('button', { name: 'Calendario', exact: true }).first().click()
  await page.getByRole('button', { name: `Aggiungi appuntamento il ${localDate()}`, exact: true }).click()
  const addDialog = page.getByRole('dialog').filter({ hasText: 'Nuovo appuntamento' })
  await addDialog.locator('input[type="time"]').nth(0).fill(`06:${minute}`)
  await addDialog.locator('input[type="time"]').nth(1).fill('06:59')
  await addDialog.getByRole('button', { name: new RegExp(PATIENT_NAME) }).first().click()
  await addDialog.getByRole('button', { name: /crea appuntamento/i }).click()
  await expect(addDialog).toBeHidden({ timeout: 60_000 })

  await page.getByRole('button', { name: 'G', exact: true }).click()
  const event = page.getByText(new RegExp(`06:${minute}`)).first()
  await event.scrollIntoViewIfNeeded()
  await event.click()
  await page.getByRole('dialog').last().getByRole('button', { name: /chiudi appuntamento/i }).click()
  const closeDialog = page.getByRole('dialog').filter({ hasText: /presenze/i }).last()
  await closeDialog.getByRole('button', { name: /chiudi appuntamento/i }).click()

  await expect(page.getByText('Appuntamento chiuso')).toBeVisible({ timeout: 60_000 })
})

test('storico e trend: tratti e badge di comparabilità', async ({ openAs }) => {
  const page = await openAs('lipedema-trainer')
  await openClient(page, PATIENT_NAME)
  await page.getByRole('button', { name: /^valutazioni$/i }).click()

  // 2MWT su percorso variante (20 m), poi standard: con quello già in storico (30 m) sono 3 tratti
  await saveSingleAssessment(page, '2MWT', async () => {
    await page.getByRole('spinbutton', { name: /lunghezza percorso/i }).fill('20')
    await page.getByRole('checkbox', { name: /conferm/i }).check()
    await page.getByRole('spinbutton', { name: 'TRATTI COMPLETI CONO→CONO' }).fill('3')
    await page.getByRole('spinbutton', { name: 'FRAZIONE FINALE (M)' }).fill('5')
  })
  await saveSingleAssessment(page, '2MWT', async () => {
    await page.getByRole('spinbutton', { name: 'TRATTI COMPLETI CONO→CONO' }).fill('4')
    await page.getByRole('spinbutton', { name: 'FRAZIONE FINALE (M)' }).fill('15')
  })

  // Dati di partenza: la paziente ha già un 2MWT standard valido (162 m, test precedente) e un
  // Handgrip D 226 · S 195 N senza seriale. Lo stato "Aggiornamento in corso…" resta al runbook TP-077
  // (la rilettura può finire prima di ogni poll). Segnale deterministico: il dato nuovo, timeout 60 s.
  const newButton = page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' }).first()
  await openTestTab(page, '2MWT')
  await expect(page.getByText('DIVERSA DALLA PRECEDENTE · percorso diverso')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/rispetto al/).first()).toBeVisible()
  await expect(page.getByRole('img', { name: /3 tratti/ })).toBeVisible()

  // Handgrip: stesso modello, seriale registrato solo ora → solo un'info, il delta resta
  await saveSingleAssessment(page, 'HANDGRIP', async () => {
    await page.getByRole('textbox', { name: /seriale/i }).fill('E2E-1')
    const newtons = ['230', '200', '236', '205', '228', '202']
    for (let i = 0; i < newtons.length; i++) {
      await page.getByRole('textbox', { name: new RegExp(`^Prova ${i + 1}, mano`) }).fill(newtons[i])
    }
  })
  await openTestTab(page, 'Handgrip')
  await expect(page.getByText('INFO · seriale non registrato')).toBeVisible({ timeout: 60_000 })
  // 236 − 226 = +10 a destra, 205 − 195 = +10 a sinistra
  await expect(page.getByText(/^D \+10 N · S \+10 N rispetto al/)).toBeVisible()
  await expect(newButton).toBeEnabled({ timeout: 60_000 })

  // 360 px: nessuno scroll orizzontale con il grafico visibile
  await page.setViewportSize({ width: 360, height: 640 })
  await expect(page.getByRole('img', { name: /Andamento Handgrip/ })).toBeVisible()
  // Il grafico si ridimensiona dopo il cambio di viewport: si aspetta che la pagina si assesti
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth), { timeout: 10_000 }).toBeLessThanOrEqual(360)
})

test('staff_readonly vede le valutazioni senza azioni', async ({ openAs }) => {
  const page = await openAs('lipedema-staff')
  await openClient(page, PATIENT_NAME)
  await page.getByRole('button', { name: /^valutazioni$/i }).click()
  await openTestTab(page, 'Handgrip')
  await expect(page.getByRole('button', { name: /D 226 · S 195 N/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' })).toHaveCount(0)

  await page.getByRole('button', { name: /D 226 · S 195 N/ }).click()
  const detail = page.getByRole('dialog').last()
  await expect(detail.getByText('Best destra')).toBeVisible()
  await expect(detail.getByRole('button', { name: 'CORREGGI' })).toHaveCount(0)
  await expect(detail.getByRole('button', { name: 'ANNULLA VALUTAZIONE' })).toHaveCount(0)
})

// ── helper ────────────────────────────────────────────────────────────────────

/** Scheda di un test nella tab VALUTAZIONI (selettore a schede, ADR-019) */
async function openTestTab(page, shortName) {
  await page.getByRole('tab', { name: shortName, exact: true }).click()
}

/**
 * Nuova valutazione di un solo test: scelta dal "Quale test?", compilazione e
 * SALVA E CHIUDI (la sequenza di visita parte comunque dal test scelto)
 */
async function saveSingleAssessment(page, pickerLabel, fillForm) {
  const newButton = page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' }).first()
  const savedToast = page.getByText('Valutazione salvata')
  // Il toast del salvataggio precedente deve essere sparito, se no sotto se ne contano due
  await expect(savedToast).toHaveCount(0, { timeout: 30_000 })
  await expect(newButton).toBeEnabled({ timeout: 60_000 })
  await newButton.click()
  await page.getByRole('dialog').getByRole('button', { name: new RegExp(`^${pickerLabel}`, 'i') }).click()
  await fillForm()
  await saveVisitStep(page, 'SALVA E CHIUDI')
  // Segnale deterministico del salvataggio riuscito (cold start delle callable su dev)
  await expect(savedToast).toBeVisible({ timeout: 60_000 })
}

/** Salva il test corrente della visita confermando il dialog */
async function saveVisitStep(page, buttonName) {
  await page.getByRole('button', { name: buttonName, exact: true }).click()
  await dialogButton(page, 'SALVA').click()
}

/** Bottone di una scelta a segmenti, cercato dentro il blocco con la sua etichetta */
async function yesNo(page, label, option) {
  await page.getByText(label, { exact: true }).locator('xpath=..').getByRole('button', { name: option, exact: true }).click()
}

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
