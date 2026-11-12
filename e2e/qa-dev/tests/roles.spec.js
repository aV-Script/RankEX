/**
 * Login per ruolo nei 3 moduli e sola lettura dello staff (STORY-041).
 * Le sessioni vengono dal login via UI del setup: qui si verifica dove atterra
 * ciascun ruolo, cosa può fare e che l'hosting non blocchi nulla con la CSP.
 */
import { test, expect } from '../fixtures.js'
import { QA_ORGS, E2E_FIXTURES_MODULE, qaUsers, readE2EFixtures } from '../qaDev.config.js'
import { isSlotInPreviousAppWeek, romeDateStr } from '../slotFixtureDate.js'

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
      // visibile allo staff, o cambia etichetta, il caso fallisce. Il dettaglio di uno slot e di
      // un gruppo (che le org qa-* non hanno di base) è coperto più sotto, con slot e gruppo E2E
      // creati dal setup.
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

// ── Dettaglio slot e gruppo: sola lettura (Sprint #18 voce 1c) ───────────────────────────────
// Slot e gruppo E2E li crea il global setup (qa-pt, cliente di base dentro entrambi). Solo
// visibilità: nessun click su CHIUDI/SEGNA COME/ELIMINA/RIMUOVI. Ogni caso apre prima popup o
// dettaglio con un controllo positivo, poi verifica le azioni: count() non aspetta il caricamento,
// quindi un conteggio a 0 vale solo a vista aperta.

const FIXTURE_ORG       = QA_ORGS[E2E_FIXTURES_MODULE]
const WRITE_USER_KEY    = `${E2E_FIXTURES_MODULE}-trainer`
const READONLY_USER_KEY = `${E2E_FIXTURES_MODULE}-staff`
// Assenza attesa ma contraddetta (prova negativa): niente attesa piena dell'expect
const NEGATIVE_TIMEOUT_MS  = 3_000

/** Apre il popup dello slot E2E dal calendario; controllo positivo: orario e cliente nel dialog */
async function openSlotPopup(page) {
  const fixtures = readE2EFixtures()
  await page.getByRole('button', { name: 'Calendario', exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Vai a oggi' })).toBeVisible()

  // La settimana dell'app parte da lunedì: di lunedì "ieri" è nella settimana precedente. Si decide
  // dalle date (fuso di Roma, lo stesso del browser: timezoneId in playwright.qa-dev.config.js)
  const isInPreviousWeek = isSlotInPreviousAppWeek(fixtures.slotDate, romeDateStr(new Date()))
  if (isInPreviousWeek) await page.getByRole('button', { name: 'Periodo precedente' }).click()

  const slotButton = page.getByRole('button', { name: new RegExp(`${fixtures.slotStart}.*${escapeRegExp(fixtures.clientName)}`) }).first()
  await expect(slotButton).toBeVisible()
  await slotButton.click()

  const popup = page.getByRole('dialog', { name: /^Dettaglio / })
  await expect(popup).toContainText(`${fixtures.slotStart} → ${fixtures.slotEnd}`)
  await expect(popup).toContainText(fixtures.clientName)
  return popup
}

function slotActions(popup) {
  return [
    popup.getByRole('button', { name: /^CHIUDI / }),
    popup.getByRole('button', { name: /^SEGNA COME / }),
    popup.getByRole('button', { name: 'ELIMINA', exact: true }),
  ]
}

async function expectSlotActionsPresent(popup) {
  for (const action of slotActions(popup)) await expect(action).toBeVisible()
}

async function expectSlotActionsAbsent(popup, options) {
  for (const action of slotActions(popup)) await expect(action).toHaveCount(0, options)
}

/** Apre il dettaglio del gruppo E2E e il menu azioni; controllo positivo: cliente tra i membri ed ESPORTA PDF */
async function openGroupDetail(page) {
  const fixtures = readE2EFixtures()
  await page.getByRole('button', { name: /^(gruppi|squadre|classi)$/i }).first().click()
  await page.getByRole('button', { name: fixtures.groupName }).click()
  // Il nome del gruppo non compare nell'intestazione del dettaglio (solo nella card della lista)
  await expect(page.getByRole('button', { name: /^Torna / })).toBeVisible()
  await expect(page.getByText(fixtures.clientName, { exact: true }).first()).toBeVisible()

  // Menu overflow: in PT esiste anche per lo staff, con dentro solo ESPORTA PDF
  await page.getByRole('button', { name: /^Azioni / }).click()
  await expect(page.getByRole('button', { name: /esporta pdf/i })).toBeVisible()
}

function groupWriteActions(page) {
  return [
    page.getByRole('button', { name: 'RIMUOVI', exact: true }),
    page.getByRole('button', { name: 'AGGIUNGI', exact: true }),
    page.getByText('Da aggiungere'),
    page.getByRole('button', { name: /rinomina/i }),
    page.getByRole('button', { name: /^elimina$/i }),
  ]
}

async function expectGroupActionsPresent(page) {
  // AGGIUNGI esiste solo se in org c'è un cliente fuori dal gruppo: si controlla la colonna
  const [removeMember, , addColumn, rename, remove] = groupWriteActions(page)
  for (const action of [removeMember, addColumn, rename, remove]) await expect(action).toBeVisible()
}

async function expectGroupActionsAbsent(page, options) {
  for (const action of groupWriteActions(page)) await expect(action).toHaveCount(0, options)
}

test.describe(`${FIXTURE_ORG.name}: dettaglio slot e gruppo`, () => {
  test('staff_readonly: popup slot senza CHIUDI / SALTA / ELIMINA', async ({ openAs }) => {
    const page = await openAs(READONLY_USER_KEY)
    await expectSlotActionsAbsent(await openSlotPopup(page))
    expect(page.cspErrors).toEqual([])
  })

  test('staff_readonly: dettaglio gruppo senza RIMUOVI / AGGIUNGI / RINOMINA / ELIMINA', async ({ openAs }) => {
    const page = await openAs(READONLY_USER_KEY)
    await openGroupDetail(page)
    await expectGroupActionsAbsent(page)
    expect(page.cspErrors).toEqual([])
  })

  test('trainer: popup slot con CHIUDI / SALTA / ELIMINA (solo visibilità)', async ({ openAs }) => {
    const page = await openAs(WRITE_USER_KEY)
    await expectSlotActionsPresent(await openSlotPopup(page))
    expect(page.cspErrors).toEqual([])
  })

  test('trainer: dettaglio gruppo con RIMUOVI / RINOMINA / ELIMINA (solo visibilità)', async ({ openAs }) => {
    const page = await openAs(WRITE_USER_KEY)
    await openGroupDetail(page)
    await expectGroupActionsPresent(page)
    expect(page.cspErrors).toEqual([])
  })

  // Prova negativa: con la sessione trainer popup e dettaglio si aprono normalmente (se non si
  // aprissero il caso fallirebbe qui, non nell'assenza), e le verifiche "da staff" devono
  // fallire proprio per il conteggio: i controlli sugli assenti distinguono davvero i due ruoli.
  test('prova negativa: con la sessione trainer il popup slot NON passa i controlli da staff', async ({ openAs }) => {
    const popup = await openSlotPopup(await openAs(WRITE_USER_KEY))
    await expect(expectSlotActionsAbsent(popup, { timeout: NEGATIVE_TIMEOUT_MS })).rejects.toThrow(/toHaveCount/)
  })

  test('prova negativa: con la sessione trainer il dettaglio gruppo NON passa i controlli da staff', async ({ openAs }) => {
    const page = await openAs(WRITE_USER_KEY)
    await openGroupDetail(page)
    await expect(expectGroupActionsAbsent(page, { timeout: NEGATIVE_TIMEOUT_MS })).rejects.toThrow(/toHaveCount/)
  })
})

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
