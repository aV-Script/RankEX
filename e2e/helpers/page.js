/**
 * Helper di navigazione e interazione riusabili tra i test.
 *
 * Nota: usa waitForLoadState('load') invece di 'networkidle'
 * perché Firebase mantiene WebSocket attive che non raggiungono mai lo stato idle.
 */

export async function waitForAppReady(page) {
  await page.waitForLoadState('load')
  // Aspetta che eventuali spinner scompaiano
  const spinner = page.locator('.loading-screen, [data-testid="loading"]')
  if (await spinner.isVisible({ timeout: 500 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 10_000 })
  }
}

export async function goto(page, path) {
  await page.goto(path)
  await waitForAppReady(page)
}

export async function openTab(page, tabName) {
  await page.getByRole('button', { name: tabName, exact: false })
    .or(page.getByText(tabName, { exact: true }))
    .first()
    .click()
  await page.waitForTimeout(300)
}

export async function fillField(page, labelOrPlaceholder, value) {
  const field = page.getByLabel(labelOrPlaceholder, { exact: false })
    .or(page.getByPlaceholder(labelOrPlaceholder, { exact: false }))
  await field.first().fill(value)
}
