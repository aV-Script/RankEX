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
  await expect(page.getByRole('button', { name: /132 m/ })).toBeVisible()          // 4 tratti × 30 m + 12 m
  await expect(page.getByRole('button', { name: /11 rip\./ })).toBeVisible()
  await expect(page.getByRole('button', { name: /D 226 · S 195 N/ })).toBeVisible()
})

test('correzione del 2MWT e annullamento del 30s-STS', async ({ openAs }) => {
  const page = await openAs('lipedema-trainer')
  await openClient(page, PATIENT_NAME)
  await page.getByRole('button', { name: /^valutazioni$/i }).click()

  await page.getByRole('button', { name: /132 m/ }).click()
  await dialogButton(page, 'CORREGGI').click()
  await page.getByRole('spinbutton', { name: 'TRATTI COMPLETI CONO→CONO' }).fill('5')
  await page.getByRole('button', { name: 'SALVA VALUTAZIONE' }).first().click()
  await page.getByRole('textbox', { name: 'MOTIVO DELLA CORREZIONE' }).fill('E2E: tratti contati male')
  await dialogButton(page, 'SALVA').click()
  await expect(page.getByText('Valutazione corretta')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('button', { name: /162 m/ })).toBeVisible()          // 5 × 30 + 12
  await expect(page.getByText('Motivo: E2E: tratti contati male')).toBeVisible()

  await page.getByRole('button', { name: /11 rip\./ }).click()
  await dialogButton(page, 'ANNULLA VALUTAZIONE').click()
  const voidDialog = page.getByRole('dialog').last()
  await voidDialog.getByRole('textbox').fill('E2E: inserita sulla paziente sbagliata')
  await voidDialog.getByRole('button', { name: /^ANNULLA VALUTAZIONE$/ }).click()
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

test('staff_readonly vede le valutazioni senza azioni', async ({ openAs }) => {
  const page = await openAs('lipedema-staff')
  await openClient(page, PATIENT_NAME)
  await page.getByRole('button', { name: /^valutazioni$/i }).click()
  await expect(page.getByRole('button', { name: /D 226 · S 195 N/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '+ NUOVA VALUTAZIONE' })).toHaveCount(0)

  await page.getByRole('button', { name: /D 226 · S 195 N/ }).click()
  const detail = page.getByRole('dialog').last()
  await expect(detail.getByText('Best destra')).toBeVisible()
  await expect(detail.getByRole('button', { name: 'CORREGGI' })).toHaveCount(0)
  await expect(detail.getByRole('button', { name: 'ANNULLA VALUTAZIONE' })).toHaveCount(0)
})

// ── helper ────────────────────────────────────────────────────────────────────

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
