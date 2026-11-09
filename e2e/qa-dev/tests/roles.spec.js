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
    }
  })
}
