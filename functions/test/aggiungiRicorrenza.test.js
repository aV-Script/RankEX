/**
 * aggiungiRicorrenza — ricorrenza e slot in un unico batch.
 * Prima, oltre ~490 slot, la scrittura era divisa in più batch e un errore a
 * metà lasciava una ricorrenza con solo parte delle sessioni.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({ batches: [] }))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => {
  let n = 0
  return {
    getFirestore: () => ({
      collection: path => ({ doc: () => ({ id: `id${++n}`, path: `${path}/id${n}` }) }),
      batch: () => {
        const b = { ops: 0, committed: false, set() { this.ops++ }, commit: async function () { this.committed = true } }
        state.batches.push(b)
        return b
      },
    }),
  }
})

vi.mock('../src/shared/auth.js', () => ({ requireOrgAccess: async () => ({ role: 'trainer', orgId: 'org1' }) }))

const { aggiungiRicorrenza } = await import('../src/callable/aggiungiRicorrenza.js')
const call = data => aggiungiRicorrenza({ auth: { uid: 't' }, data: { orgId: 'org1', clientIds: ['c1'], startTime: '07:00', endTime: '08:00', ...data } })

beforeEach(() => { state.batches = [] })

describe('aggiungiRicorrenza', () => {
  it('un anno, 7 giorni su 7: ricorrenza + 365 slot in un solo batch', async () => {
    const res = await call({ days: [0, 1, 2, 3, 4, 5, 6], startDate: '2027-01-01', endDate: '2027-12-31' })
    expect(res.slots).toBe(365)
    expect(state.batches).toHaveLength(1)
    expect(state.batches[0]).toMatchObject({ ops: 366, committed: true })
  })

  it('oltre il tetto viene rifiutata senza scrivere nulla', async () => {
    await expect(call({ days: [0, 1, 2, 3, 4, 5, 6], startDate: '2027-01-01', endDate: '2028-06-30' }))
      .rejects.toMatchObject({ code: 'failed-precondition' })
    expect(state.batches.every(b => !b.committed)).toBe(true)
  })

  it("rifiuta fine prima dell'inizio e orari invertiti", async () => {
    await expect(call({ days: [1], startDate: '2027-02-01', endDate: '2027-01-01' })).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(call({ days: [1], startDate: '2027-01-01', endDate: '2027-02-01', startTime: '09:00', endTime: '08:00' })).rejects.toMatchObject({ code: 'invalid-argument' })
  })
})
