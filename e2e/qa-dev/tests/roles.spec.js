/**
 * Login per ruolo nei 3 moduli e sola lettura dello staff (STORY-041).
 * Le sessioni vengono dal login via UI del setup: qui si verifica dove atterra
 * ciascun ruolo, cosa può fare e che l'hosting non blocchi nulla con la CSP.
 */
import { test, expect } from '../fixtures.js'
import { QA_ORGS, qaUsers } from '../qaDev.config.js'

for (const [moduleKey, org] of Object.entries(QA_ORGS)) {
  test.describe(`${org.name}: ruoli`, () => {
    for (const user of qaUsers(moduleKey)) {
      test(`${user.role} entra e vede ${org.baseClient.name}`, async ({ openAs }) => {
        const page = await openAs(user.key)
        await expect(page).not.toHaveURL(/\/login/)
        await expect(page.getByRole('button', { name: new RegExp(org.baseClient.name) }).first()).toBeVisible()

        const isReadonly = user.role === 'staff_readonly'
        await expect(page.getByText(/MODALITÀ SOLA LETTURA/)).toHaveCount(isReadonly ? 1 : 0)
        await expect(page.getByRole('button', { name: '+ NUOVO' })).toHaveCount(isReadonly ? 0 : 1)
        await expect(page.getByRole('button', { name: /^team$/i })).toHaveCount(user.role === 'org_admin' ? 1 : 0)
        expect(page.cspErrors).toEqual([])
      })

      // BUG-007 / BUG-024: nessuna azione di scrittura per lo staff, presenti per chi può scrivere.
      // Il conteggio > 0 per trainer e org_admin è il controllo positivo: se un bottone torna
      // visibile allo staff, o cambia etichetta, il caso fallisce. Le org qa-* non hanno slot né
      // gruppi: il dettaglio slot (CHIUDI/SALTA/ELIMINA) e quello gruppo (RIMUOVI/AGGIUNGI,
      // rinomina/elimina) restano al runbook (TP-085).
      test(`${user.role}: azioni di scrittura di Calendario e Gruppi`, async ({ openAs }) => {
        const page = await openAs(user.key)
        const isReadonly = user.role === 'staff_readonly'

        await page.getByRole('button', { name: 'Calendario', exact: true }).first().click()
        await expect(page.getByRole('button', { name: 'Vai a oggi' })).toBeVisible()
        // Testata ("Aggiungi sessione|appuntamento", "Aggiungi ricorrenza") e "+" delle celle
        // ("Aggiungi … il AAAA-MM-GG") hanno tutti un nome che inizia per "Aggiungi"
        const calendarAdd = page.getByRole('button', { name: /^Aggiungi /i })
        if (isReadonly) await expect(calendarAdd).toHaveCount(0)
        else await expect(calendarAdd.first()).toBeVisible()

        await page.getByRole('button', { name: /^(gruppi|squadre|classi)$/i }).first().click()
        await expect(page.getByPlaceholder(/^Cerca /)).toBeVisible()
        const newGroup = page.getByRole('button', { name: /^\+ NUOV[OA]$/ })
        await expect(newGroup).toHaveCount(isReadonly ? 0 : 1)
        expect(page.cspErrors).toEqual([])
      })
    }
  })
}
