/**
 * Soccer su rankex-dev (STORY-041): nuovo allievo dal wizard (ruolo e account),
 * fascia derivata dall'età. Allievo E2E- cancellato dal teardown.
 */
import { test, expect, e2eName, dialogButton } from '../fixtures.js'

test('coach crea un allievo dal wizard', async ({ openAs }) => {
  const name = e2eName('Allievo')
  const page = await openAs('soccer-trainer')
  await page.getByRole('button', { name: '+ NUOVO' }).click()

  await page.locator('#wizard-name').fill(name)
  await page.locator('input[type="date"]').first().fill('2016-02-10')
  await page.getByRole('button', { name: 'M', exact: true }).click()
  await page.locator('#wizard-peso').fill('30')
  await page.locator('#wizard-altezza').fill('135')
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.getByText('Portiere', { exact: true }).click()
  await page.getByRole('button', { name: /avanti/i }).click()
  await page.locator('#wizard-email').fill(`e2e.soccer.${Date.now()}@test.rankex`)
  await page.locator('#wizard-password').fill('E2eAllievo2026')
  await page.getByRole('button', { name: 'CREA ALLIEVO' }).last().click()
  await dialogButton(page, 'CREA ALLIEVO').click()

  await expect(page.getByText('Allievo creato')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(name).first()).toBeVisible()
  expect(page.cspErrors).toEqual([])
})
