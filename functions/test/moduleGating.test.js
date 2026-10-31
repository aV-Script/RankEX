/**
 * Controllo di modulo nelle callable (ADR-008, STORY-030).
 *
 * Il modulo si legge da organizations/{orgId}.moduleType lato server: in
 * lipedema le callable di gamification/percentili/obiettivi rifiutano anche se
 * chiamate direttamente, salvaBia salva solo la misurazione. Un moduleType
 * sconosciuto è un dato corrotto e viene rifiutato; assente = PT legacy.
 * Admin SDK e firebase-functions sono mockati con uno store in memoria.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const db = vi.hoisted(() => ({ docs: new Map(), autoId: 0, caller: null }))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => {
  const snapshot = path => ({
    id:     path.split('/').pop(),
    exists: db.docs.has(path),
    data:   () => structuredClone(db.docs.get(path)),
  })
  const ref = path => ({
    path,
    get:    async () => snapshot(path),
    set:    async data => { db.docs.set(path, structuredClone(data)) },
    update: async data => { db.docs.set(path, { ...db.docs.get(path), ...data }) },
  })
  const collection = path => ({
    doc:   id => ref(`${path}/${id ?? `auto${++db.autoId}`}`),
    where: () => ({ isQuery: true, path }),
  })
  return {
    getFirestore: () => ({
      collection,
      doc: ref,
      runTransaction: async fn => {
        const writes = []
        const tx = {
          get: async target => target.isQuery
            ? { docs: [...db.docs.keys()].filter(path => path.startsWith(`${target.path}/`)).map(path => ({ ref: ref(path), data: () => db.docs.get(path) })) }
            : snapshot(target.path),
          update: (target, data) => writes.push(() => db.docs.set(target.path, { ...db.docs.get(target.path), ...data })),
          set:    (target, data) => writes.push(() => db.docs.set(target.path, data)),
        }
        const result = await fn(tx)
        writes.forEach(write => write())
        return result
      },
    }),
  }
})

vi.mock('../src/shared/auth.js', () => ({
  requireOrgAccess:         async () => ({ uid: 'trainer1', role: 'trainer', orgId: 'org1' }),
  requireOrgMemberOrClient: async () => db.caller,
}))

const { salvaXP }                = await import('../src/callable/salvaXP.js')
const { salvaCampionamento }     = await import('../src/callable/salvaCampionamento.js')
const { aggiornaProfiloCliente } = await import('../src/callable/aggiornaProfiloCliente.js')
const { aggiungiObiettivo }      = await import('../src/callable/aggiungiObiettivo.js')
const { annullaObiettivo }       = await import('../src/callable/annullaObiettivo.js')
const { acquistaAvatar }         = await import('../src/callable/acquistaAvatar.js')
const { salvaBia }               = await import('../src/callable/salvaBia.js')

const ORG    = 'organizations/org1'
const CLIENT = 'organizations/org1/clients/c1'
const GOAL   = 'organizations/org1/clients/c1/goals/g1'
const client = () => db.docs.get(CLIENT)
const notifs = () => [...db.docs.keys()].filter(path => path.includes('/notifications/'))
const req    = data => ({ auth: { uid: 'trainer1' }, data: { orgId: 'org1', clientId: 'c1', ...data } })

const CALLS = {
  salvaXP:                () => salvaXP(req({ xpToAdd: 50, note: 'bonus' })),
  salvaCampionamento:     () => salvaCampionamento(req({ testValues: { velocita: 3.5 } })),
  aggiornaProfiloCliente: () => aggiornaProfiloCliente(req({ newProfileType: 'complete' })),
  aggiungiObiettivo:      () => aggiungiObiettivo(req({ testKey: 'sprint_20m', targetPercentile: 70, deadline: '2099-01-01' })),
  annullaObiettivo:       () => annullaObiettivo(req({ goalId: 'g1' })),
  acquistaAvatar:         () => acquistaAvatar(req({ avatarId: 'avatar-07' })),
}

function seed(moduleType) {
  db.docs = new Map([
    [ORG,    moduleType === undefined ? {} : { moduleType }],
    [CLIENT, {
      name: 'P', sesso: 'F', eta: 40, categoria: null, profileType: 'complete', clientAuthUid: 'uC1',
      xp: 10, xpNext: 500, level: 1, log: [], coins: 500, avatarPurchased: [],
      lastBia: null, biaHistory: [],
      // salvaBia in lipedema richiede l'informativa (ADR-015 §1, valutazioni.test.js)
      privacyNotice: { informativaVersion: 'v1', deliveredAt: '2026-10-01', recordedBy: 'trainer1' },
    }],
    [GOAL,   { testKey: 'sprint_20m', status: 'active' }],
  ])
  db.autoId = 0
  db.caller = { uid: 'uC1', role: 'client', orgId: 'org1', clientId: 'c1' }
}

const BIA = { fatMassPercent: 30, muscleMassKg: 40, waterPercent: 50, visceralFat: 5 }

describe('modulo lipedema', () => {
  beforeEach(() => seed('lipedema'))

  it.each(Object.keys(CALLS))('%s: rifiutata con failed-precondition, nessuna scrittura', async (name) => {
    const prima = structuredClone([...db.docs.entries()])
    await expect(CALLS[name]()).rejects.toMatchObject({ code: 'failed-precondition' })
    expect([...db.docs.entries()]).toEqual(prima)
  })

  it('salvaBia: salva solo lastBia/biaHistory, niente xp/livello/log né notifica', async () => {
    const prima = structuredClone(client())
    const res = await salvaBia(req({ biaData: BIA }))
    expect(res).toMatchObject({ ok: true, xpEarned: 0, isFirstMeasurement: true })
    expect(client().lastBia).toMatchObject(BIA)
    expect(client().biaHistory).toHaveLength(1)
    expect(client()).toMatchObject({ xp: prima.xp, level: prima.level, xpNext: prima.xpNext, log: [] })
    expect(notifs()).toHaveLength(0)
  })
})

describe('moduli con gamification: comportamento invariato', () => {
  it.each(['personal_training', undefined])('salvaXP e salvaBia accreditano XP (moduleType %s)', async (moduleType) => {
    seed(moduleType)
    await salvaXP(req({ xpToAdd: 50, note: 'bonus' }))
    expect(client().xp).toBe(60)
    const res = await salvaBia(req({ biaData: BIA }))
    expect(res.xpEarned).toBeGreaterThan(0)
    expect(client().xp).toBeGreaterThan(60)
  })

  it('soccer: obiettivi e upgrade profilo restano disponibili', async () => {
    seed('soccer_academy')
    await expect(CALLS.annullaObiettivo()).resolves.toMatchObject({ ok: true })
    await expect(CALLS.aggiornaProfiloCliente()).resolves.toMatchObject({ ok: true })
    await expect(CALLS.aggiungiObiettivo()).resolves.toMatchObject({ status: 'active' })
  })

  it('PT: acquisto avatar consentito', async () => {
    seed('personal_training')
    await expect(CALLS.acquistaAvatar()).resolves.toMatchObject({ ok: true })
  })
})

describe('moduleType sconosciuto', () => {
  beforeEach(() => seed('qualcosa'))

  it.each([...Object.keys(CALLS), 'salvaBia'])('%s: rifiutata (dato corrotto, non degradato su PT)', async (name) => {
    const call = name === 'salvaBia' ? () => salvaBia(req({ biaData: BIA })) : CALLS[name]
    await expect(call()).rejects.toMatchObject({ code: 'failed-precondition' })
  })
})

describe('org inesistente', () => {
  it('salvaXP: not-found', async () => {
    seed('personal_training')
    db.docs.delete(ORG)
    await expect(CALLS.salvaXP()).rejects.toMatchObject({ code: 'not-found' })
  })
})
