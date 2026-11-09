/**
 * Fixture della QA automatica (STORY-041): openAs(userKey) apre una pagina già
 * autenticata con la sessione salvata dal setup e raccoglie gli errori CSP della
 * console (gli header dell'hosting sono parte di ciò che la suite verifica, BUG-009).
 */
import { test as base, expect } from '@playwright/test'
import { authStatePath, E2E_PREFIX } from './qaDev.config.js'

export const test = base.extend({
  openAs: async ({ browser }, provide) => {
    const contexts = []
    await provide(async (userKey) => {
      const context = await browser.newContext({ storageState: authStatePath(userKey) })
      contexts.push(context)
      const page = await context.newPage()
      page.cspErrors = []
      page.on('console', message => {
        if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) page.cspErrors.push(message.text())
      })
      await page.goto('/')
      return page
    })
    for (const context of contexts) await context.close()
  },
})

export { expect }

/** Nome univoco con il prefisso cancellato dal teardown */
export function e2eName(label) {
  return `${E2E_PREFIX}${label} ${Date.now().toString(36)}`
}

/** Apre la scheda di un cliente/paziente dalla lista */
export async function openClient(page, name) {
  await page.getByRole('button', { name: new RegExp(escapeRegExp(name)) }).first().click()
  await expect(page.getByRole('button', { name: 'Torna ai pazienti' })
    .or(page.getByRole('button', { name: /^Torna ai/ })).first()).toBeVisible()
}

/** Bottone di conferma del dialog aperto */
export function dialogButton(page, name) {
  return page.getByRole('dialog').last().getByRole('button', { name, exact: true })
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
