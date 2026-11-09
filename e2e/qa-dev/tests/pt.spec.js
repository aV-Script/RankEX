/**
 * Flussi critici PT su rankex-dev (STORY-041): nuovo cliente dal wizard (account e
 * profilo Completo), BIA, chiusura di una sessione dal calendario. Tutto su un
 * cliente E2E- creato qui e cancellato dal teardown.
 */
import { test, expect, e2eName, openClient, dialogButton } from '../fixtures.js'

const CLIENT_NAME = e2eName('Cliente PT')

test.describe.configure({ mode: 'serial' })

test('trainer crea un cliente dal wizard', async ({ openAs }) => {
  const page = await openAs('pt-trainer')
  await page.getByRole('button', { name: '+ NUOVO' }).click()

  await page.locator('#wizard-name').fill(CLIENT_NAME)
  await page.locator('input[type="date"]').first().fill('1992-04-20')
  await page.getByRole('button', { name: 'F', exact: true }).click()
  await page.locator('#wizard-peso').fill('62')
  await page.locator('#wizard-altezza').fill('168')
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.getByRole('button', { name: /^Completo/ }).click()
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.getByText('Active', { exact: true }).click()
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.locator('#wizard-email').fill(`e2e.pt.${Date.now()}@test.rankex`)
  await page.locator('#wizard-password').fill('E2eCliente2026')
  await page.getByRole('button', { name: 'CREA CLIENTE' }).last().click()
  await dialogButton(page, 'CREA CLIENTE').click()

  await expect(page.getByText('Cliente creato')).toBeVisible({ timeout: 60_000 })
  // Dopo la creazione si apre la scheda del nuovo cliente
  await expect(page.getByRole('button', { name: 'Torna ai clienti' })).toBeVisible()
  await expect(page.getByText(CLIENT_NAME).first()).toBeVisible()
})

test('trainer salva una BIA', async ({ openAs }) => {
  const page = await openAs('pt-trainer')
  await openClient(page, CLIENT_NAME)
  await page.getByRole('button', { name: 'BIA', exact: true }).click()
  await page.getByRole('button', { name: '+ RILEVAMENTO' }).click()

  // Ordine del form: massa grassa, muscolare, acqua, ossea, metabolismo, età metabolica, viscerale
  const values = ['27.5', '24.1', '52.3', '2.4', '1400', '30', '6']
  const inputs = page.locator('input[type="number"][placeholder="0"]')
  for (let i = 0; i < values.length; i++) await inputs.nth(i).fill(values[i])
  await page.getByRole('button', { name: 'SALVA BIA' }).first().click()
  await dialogButton(page, 'SALVA').click()

  await expect(page.getByText('BIA salvata')).toBeVisible({ timeout: 60_000 })
})

test('trainer chiude una sessione dal calendario', async ({ openAs }) => {
  const page  = await openAs('pt-trainer')
  const today = localDate()
  // Orario unico per non confondersi con sessioni di altre esecuzioni
  const minute = String(new Date().getMinutes()).padStart(2, '0')

  await page.getByRole('button', { name: 'Calendario', exact: true }).first().click()
  await page.getByRole('button', { name: `Aggiungi sessione il ${today}`, exact: true }).click()
  const addDialog = page.getByRole('dialog').filter({ hasText: 'Nuova sessione' })
  await addDialog.locator('input[type="time"]').nth(0).fill(`05:${minute}`)
  await addDialog.locator('input[type="time"]').nth(1).fill('05:59')
  await addDialog.getByRole('button', { name: new RegExp(CLIENT_NAME) }).first().click()
  await addDialog.getByRole('button', { name: /crea sessione/i }).click()
  await expect(addDialog).toBeHidden({ timeout: 60_000 })

  await page.getByRole('button', { name: 'G', exact: true }).click()
  const event = page.getByText(new RegExp(`05:${minute}`)).first()
  await event.scrollIntoViewIfNeeded()
  await event.click()
  await page.getByRole('dialog').last().getByRole('button', { name: /chiudi sessione/i }).click()
  const closeDialog = page.getByRole('dialog').filter({ hasText: /presenze/i }).last()
  await closeDialog.getByRole('button', { name: /chiudi sessione/i }).click()

  await expect(page.getByText(/Sessione chiusa/)).toBeVisible({ timeout: 60_000 })
})

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
