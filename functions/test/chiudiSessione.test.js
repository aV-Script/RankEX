/**
 * chiudiSessione — idempotenza e validazione dei presenti.
 *
 * Prima il controllo "sessione già chiusa" stava fuori da una transazione:
 * due chiamate ravvicinate accreditavano XP e Monete due volte. Gli id dei
 * presenti non erano deduplicati né confrontati con i clienti dello slot.
 * Il mock di Firestore simula una transazione: letture dallo stato, scritture
 * applicate solo a fine callback.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const db = vi.hoisted(() => ({ docs: new Map(), autoId: 0 }))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => {
  const ref = path => ({ path })
  const collection = path => ({
    doc:   id => ref(`${path}/${id ?? `auto${++db.autoId}`}`),
    // Solo il caso usato dalla callable: where(campo, 'in', valori)
    where: (field, _op, values) => ({ isQuery: true, path, field, values }),
  })
  const apply = (path, data, merge) => {
    const prev = merge ? (db.docs.get(path) ?? {}) : {}
    const next = { ...prev }
    for (const [k, v] of Object.entries(data)) {
      next[k] = v?.__increment !== undefined ? (prev[k] ?? 0) + v.__increment : v
    }
    db.docs.set(path, next)
  }
  return {
    FieldValue: { increment: n => ({ __increment: n }) },
    getFirestore: () => ({
      collection,
      runTransaction: async fn => {
        const writes = []
        const tx = {
          get: async r => r.isQuery
            ? {
                docs: [...db.docs.entries()]
                  .filter(([p, d]) => p.startsWith(`${r.path}/`) && r.values.includes(d[r.field]))
                  .map(([p, d]) => ({ id: p.split('/').pop(), ref: ref(p), data: () => structuredClone(d) })),
              }
            : {
                id:     r.path.split('/').pop(),
                exists: db.docs.has(r.path),
                data:   () => structuredClone(db.docs.get(r.path)),
              },
          update: (r, data) => writes.push([r.path, data, true]),
          set:    (r, data) => writes.push([r.path, data, false]),
        }
        const result = await fn(tx)
        writes.forEach(([path, data, merge]) => apply(path, data, merge))
        return result
      },
    }),
  }
})

vi.mock('../src/shared/auth.js', () => ({
  requireOrgAccess: async () => ({ role: 'trainer', orgId: 'org1' }),
}))

const { chiudiSessione } = await import('../src/callable/chiudiSessione.js')

const SLOT    = 'organizations/org1/slots/s1'
const client  = id => db.docs.get(`organizations/org1/clients/${id}`)
const notifs  = () => [...db.docs.keys()].filter(k => k.includes('/notifications/'))
const call    = attendeeIds => chiudiSessione({ auth: { uid: 'trainer1' }, data: { orgId: 'org1', slotId: 's1', attendeeIds } })

beforeEach(() => {
  db.docs = new Map([
    [SLOT, { date: '2026-10-23', status: 'planned', clientIds: ['a', 'b'] }],
    ['organizations/org1/clients/a', { xp: 0, xpNext: 500, level: 1, sessionStreak: 2, sessionCount: 4, log: [], coins: 0, clientAuthUid: 'uA' }],
    ['organizations/org1/clients/b', { xp: 0, xpNext: 500, level: 1, sessionStreak: 3, log: [], coins: 0 }],
    ['organizations/org1/clients/x', { xp: 0, xpNext: 500, level: 1, log: [], coins: 0 }],
  ])
  db.autoId = 0
})

describe('chiudiSessione', () => {
  it('chiude la sessione: presenti con XP, Monete e sessionCount, assenti con streak azzerata', async () => {
    const res = await call(['a'])
    expect(res).toMatchObject({ ok: true, attendees: 1, absentees: 1, ignored: 0 })
    expect(db.docs.get(SLOT)).toMatchObject({ status: 'completed', attendees: ['a'], absentees: ['b'] })
    expect(client('a')).toMatchObject({ sessionStreak: 3, sessionCount: 5, coins: 10 })
    expect(client('a').xp).toBeGreaterThan(0)
    expect(client('b').sessionStreak).toBe(0)
    expect(notifs()).toHaveLength(1)   // solo 'a' ha un account
  })

  it('una seconda chiusura della stessa sessione viene rifiutata senza riaccreditare', async () => {
    await call(['a'])
    const dopoPrima = structuredClone(client('a'))
    await expect(call(['a'])).rejects.toMatchObject({ code: 'failed-precondition' })
    expect(client('a')).toEqual(dopoPrima)
  })

  it('id duplicati contano una volta sola', async () => {
    const res = await call(['a', 'a', 'a'])
    expect(res.attendees).toBe(1)
    expect(client('a')).toMatchObject({ sessionCount: 5, coins: 10 })
  })

  it('id estranei allo slot vengono ignorati', async () => {
    const res = await call(['a', 'x'])
    expect(res).toMatchObject({ attendees: 1, ignored: 1 })
    expect(client('x')).toMatchObject({ coins: 0, xp: 0 })
    expect(client('x').sessionCount).toBeUndefined()
  })

  it('assegna i trofei maturati con questa sessione', async () => {
    await call(['a'])   // sessionCount 4 → 5
    expect(client('a')['badges.prima_sessione']).toMatchObject({ awardedBy: 'system' })
    expect(client('a')['badges.striscia_5']).toMatchObject({ awardedBy: 'system' })
    expect(client('a')['badges.striscia_10']).toBeUndefined()
  })

  it('non riassegna un trofeo già ottenuto (awardedAt resta quello originale)', async () => {
    db.docs.get('organizations/org1/clients/a').badges = { prima_sessione: { awardedAt: 1, awardedBy: 'system' } }
    await call(['a'])
    expect(client('a')['badges.prima_sessione']).toBeUndefined()
    expect(client('a')['badges.striscia_5']).toBeDefined()
  })

  describe('scheda allenamento', () => {
    const PLAN = 'organizations/org1/workoutPlans/p1'
    const plan = () => db.docs.get(PLAN)

    it('ogni presenza fa avanzare la scheda attiva, senza bonus prima della fine', async () => {
      db.docs.set(PLAN, { clientId: 'a', status: 'active', title: 'Forza', targetSessions: 3, completedSessions: 1 })
      await call(['a'])
      expect(plan().completedSessions).toBe(2)
      expect(plan().completedAt).toBeUndefined()
      expect(client('a').log[0].action).toMatch(/^Sessione di allenamento/)
    })

    it("all'ultima sessione prevista: scheda completata e bonus XP una volta sola", async () => {
      db.docs.set(PLAN, { clientId: 'a', status: 'active', title: 'Forza', targetSessions: 3, completedSessions: 2 })
      await call(['a'])
      expect(plan().completedSessions).toBe(3)
      expect(plan().completedAt).toBeDefined()
      expect(client('a').log[0]).toMatchObject({ action: 'Scheda completata: Forza (+100 XP)', xp: 100 })
      expect(client('a').log[1].action).toMatch(/^Sessione di allenamento/)

      // Una sessione dopo la fine conta, ma non ridà il bonus
      db.docs.set(SLOT, { date: '2026-10-24', status: 'planned', clientIds: ['a'] })
      await call(['a'])
      expect(plan().completedSessions).toBe(4)
      expect(client('a').log[0].action).toMatch(/^Sessione di allenamento/)
    })

    it('scheda senza sessioni previste: conta, mai bonus; schede archiviate e assenti non toccate', async () => {
      db.docs.set(PLAN, { clientId: 'a', status: 'active', title: 'Libera' })
      db.docs.set('organizations/org1/workoutPlans/old', { clientId: 'a', status: 'archived', completedSessions: 5 })
      db.docs.set('organizations/org1/workoutPlans/pb', { clientId: 'b', status: 'active', completedSessions: 0 })
      await call(['a'])
      expect(plan()).toMatchObject({ completedSessions: 1 })
      expect(plan().completedAt).toBeUndefined()
      expect(db.docs.get('organizations/org1/workoutPlans/old').completedSessions).toBe(5)
      expect(db.docs.get('organizations/org1/workoutPlans/pb').completedSessions).toBe(0)
    })
  })

  it('primo conteggio sessioni per un cliente senza sessionCount', async () => {
    await call(['b'])
    expect(client('b').sessionCount).toBe(1)
  })
})
