/**
 * creaCliente — ramo per modulo (ADR-010, STORY-032).
 *
 * Nelle org senza login del cliente (lipedema) niente account Auth né /users/{uid},
 * email facoltativa, password rifiutata, nessun campo di gamification sul doc, audit
 * senza nome; clientCount e limite piano come negli altri moduli. PT invariato.
 * Admin SDK e firebase-functions sono mockati con uno store in memoria.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const db = vi.hoisted(() => ({ docs: new Map(), autoId: 0, authCreated: [], authDeleted: [], audit: [] }))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => {
  const ref = path => ({
    path,
    id:  path.split('/').pop(),
    get: async () => ({ exists: db.docs.has(path), data: () => structuredClone(db.docs.get(path)) }),
  })
  const applyUpdate = (path, data) => {
    const current = { ...db.docs.get(path) }
    for (const [key, value] of Object.entries(data)) {
      current[key] = value?.__increment !== undefined ? (current[key] ?? 0) + value.__increment : value
    }
    db.docs.set(path, current)
  }
  return {
    FieldValue: { increment: n => ({ __increment: n }) },
    getFirestore: () => ({
      doc:        ref,
      collection: path => ({
        doc: id => ref(`${path}/${id ?? `auto${++db.autoId}`}`),
        add: async data => { if (path === 'audit_logs') db.audit.push(data) },
      }),
      batch: () => {
        const writes = []
        return {
          set:    (target, data) => writes.push(() => db.docs.set(target.path, structuredClone(data))),
          update: (target, data) => writes.push(() => applyUpdate(target.path, data)),
          commit: async () => writes.forEach(write => write()),
        }
      },
    }),
  }
})

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    createUser: async ({ email }) => { db.authCreated.push(email); return { uid: `uid-${email}` } },
    deleteUser: async uid => { db.authDeleted.push(uid) },
  }),
}))

vi.mock('../src/shared/auth.js', () => ({
  requireOrgAccess: async () => ({ uid: 'trainer1', role: 'trainer', orgId: 'org1' }),
}))

const { creaCliente } = await import('../src/callable/creaCliente.js')

const ORG = 'organizations/org1'
// Stesso payload del wizard (useWizard → handleConfirmSubmit): niente eta, la deriva il server
const ANAGRAFICA = { name: 'Anna Bianchi', dataNascita: '1985-03-12', sesso: 'F', peso: 72, altezza: 165 }
const TODAY      = new Date('2026-10-25T12:00:00')
const GAMIFICATION_FIELDS = [
  'xp', 'level', 'xpNext', 'rank', 'rankColor', 'media', 'stats', 'campionamenti', 'log',
  'sessionStreak', 'coins', 'avatarPurchased', 'badges', 'baseXP',
]

const call = formData => creaCliente({
  auth: { uid: 'trainer1', token: { email: 'trainer@org.it' } },
  data: { orgId: 'org1', trainerId: 'trainer1', formData },
})
const clientDocs = () => [...db.docs.entries()].filter(([path]) => path.startsWith(`${ORG}/clients/`))
const userDocs   = () => [...db.docs.keys()].filter(path => path.startsWith('users/'))
const flush      = () => new Promise(resolve => setTimeout(resolve, 0))

function setOrg(moduleType, extra = {}) {
  db.docs.set(ORG, { plan: 'free', clientCount: 0, ...(moduleType ? { moduleType } : {}), ...extra })
}

beforeEach(() => {
  db.docs.clear()
  db.autoId      = 0
  db.authCreated = []
  db.authDeleted = []
  db.audit       = []
  // Solo Date: l'età derivata dalla data di nascita non deve dipendere dal giorno in cui gira il test
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TODAY)
})

afterEach(() => vi.useRealTimers())

describe('creaCliente — modulo senza login (lipedema)', () => {
  beforeEach(() => setOrg('lipedema'))

  it('crea il paziente senza account Auth né /users, senza campi di gamification', async () => {
    const res = await call({ ...ANAGRAFICA })

    expect(db.authCreated).toEqual([])
    expect(userDocs()).toEqual([])

    const [[, doc]] = clientDocs()
    expect(doc).toMatchObject({
      ...ANAGRAFICA,
      eta:           41,
      email:         null,
      clientAuthUid: null,
      categoria:     null,
      profileType:   'complete',
      misureHistory: [],
      biaHistory:    [],
      lastBia:       null,
      trainerId:     'trainer1',
    })
    for (const field of GAMIFICATION_FIELDS) expect(doc).not.toHaveProperty(field)
    expect(doc).not.toHaveProperty('moduleType')

    expect(db.docs.get(ORG).clientCount).toBe(1)
    expect(res).toMatchObject({ id: 'auto1', clientAuthUid: null, email: null })
  })

  it('ignora i campi non previsti mandati dal client (gamification, categoria, ruolo)', async () => {
    await call({ ...ANAGRAFICA, xp: 9999, coins: 500, rank: 'S', categoria: 'athlete', ruolo: 'forward', profileType: 'tests_only', stats: { forza: 99 } })
    const [[, doc]] = clientDocs()
    for (const field of GAMIFICATION_FIELDS) expect(doc).not.toHaveProperty(field)
    expect(doc).toMatchObject({ categoria: null, profileType: 'complete' })
    expect(doc).not.toHaveProperty('ruolo')
  })

  it('email facoltativa: se presente viene validata e salvata senza spazi', async () => {
    await call({ ...ANAGRAFICA, email: '  anna@example.com ' })
    const [[, doc]] = clientDocs()
    expect(doc.email).toBe('anna@example.com')
    expect(db.authCreated).toEqual([])
  })

  it('email in formato non valido → invalid-argument, nessuna scrittura', async () => {
    await expect(call({ ...ANAGRAFICA, email: 'non-una-email' })).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(clientDocs()).toEqual([])
    expect(db.docs.get(ORG).clientCount).toBe(0)
  })

  it('password inviata → rifiutata, nessuna scrittura', async () => {
    await expect(call({ ...ANAGRAFICA, email: 'anna@example.com', password: 'Password1' }))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    expect(db.authCreated).toEqual([])
    expect(clientDocs()).toEqual([])
  })

  it('limite piano clienti applicato come negli altri moduli', async () => {
    setOrg('lipedema', { clientCount: 10 })
    await expect(call({ ...ANAGRAFICA })).rejects.toMatchObject({ code: 'resource-exhausted' })
    expect(clientDocs()).toEqual([])
  })

  it('audit CLIENT_CREATED con soli identificativi, senza nome (ADR-015 §2)', async () => {
    const res = await call({ ...ANAGRAFICA })
    await flush()
    expect(db.audit).toHaveLength(1)
    expect(db.audit[0]).toMatchObject({ action: 'CLIENT_CREATED' })
    expect(db.audit[0].details).toEqual({ clientId: res.id, orgId: 'org1' })
    expect(JSON.stringify(db.audit[0])).not.toContain(ANAGRAFICA.name)
  })
})

describe('creaCliente — senza login: validazione anagrafica (M1)', () => {
  beforeEach(() => setOrg('lipedema'))

  const rejects = async formData => {
    await expect(call(formData)).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(clientDocs()).toEqual([])
    expect(db.docs.get(ORG).clientCount).toBe(0)
  }

  it('nome obbligatorio, non vuoto, max 100 caratteri; salvato senza spazi ai bordi', async () => {
    await rejects({ ...ANAGRAFICA, name: undefined })
    await rejects({ ...ANAGRAFICA, name: '   ' })
    await rejects({ ...ANAGRAFICA, name: 'x'.repeat(101) })
    await rejects({ ...ANAGRAFICA, name: 42 })
    await call({ ...ANAGRAFICA, name: '  Anna Bianchi  ' })
    expect(clientDocs()[0][1].name).toBe('Anna Bianchi')
  })

  it('sesso solo M o F (valori del wizard), oppure assente', async () => {
    await rejects({ ...ANAGRAFICA, sesso: 'X' })
    await rejects({ ...ANAGRAFICA, sesso: 'f' })
    await call({ ...ANAGRAFICA, sesso: undefined })
    expect(clientDocs()[0][1].sesso).toBeNull()
  })

  it('peso e altezza: numeri finiti negli intervalli del wizard, oppure null', async () => {
    for (const peso of [19, 301, Number.NaN, '72']) await rejects({ ...ANAGRAFICA, peso })
    for (const altezza of [49, 251, Number.POSITIVE_INFINITY]) await rejects({ ...ANAGRAFICA, altezza })
    await call({ ...ANAGRAFICA, peso: null, altezza: undefined })
    expect(clientDocs()[0][1]).toMatchObject({ peso: null, altezza: null })
  })

  it('dataNascita AAAA-MM-GG; età fuori 3-100 rifiutata', async () => {
    for (const dataNascita of ['12/03/1985', '1985-13-40', 19850312]) await rejects({ ...ANAGRAFICA, dataNascita })
    await rejects({ ...ANAGRAFICA, dataNascita: '2025-01-01' })   // 1 anno
    await rejects({ ...ANAGRAFICA, dataNascita: '1900-01-01' })   // 126 anni
  })

  it('eta derivata dalla data di nascita: un valore contraddittorio dal client è ignorato', async () => {
    await call({ ...ANAGRAFICA, eta: 7 })
    expect(clientDocs()[0][1].eta).toBe(41)
  })

  it('senza data di nascita: eta facoltativa, intera 3-100', async () => {
    await rejects({ ...ANAGRAFICA, dataNascita: null, eta: 2 })
    await rejects({ ...ANAGRAFICA, dataNascita: null, eta: 40.5 })
    await call({ ...ANAGRAFICA, dataNascita: null, eta: 40 })
    expect(clientDocs()[0][1]).toMatchObject({ dataNascita: null, eta: 40 })
  })
})

describe('creaCliente — moduli con login (PT, soccer) invariati', () => {
  it.each([['personal_training'], ['soccer_academy'], [null]])('%s: account Auth + /users + gamification', async moduleType => {
    setOrg(moduleType)
    await call({ ...ANAGRAFICA, categoria: 'health', profileType: 'tests_only', email: 'anna@example.com', password: 'Password1' })

    expect(db.authCreated).toEqual(['anna@example.com'])
    expect(db.docs.get('users/uid-anna@example.com')).toMatchObject({ role: 'client', orgId: 'org1', mustChangePassword: true })
    const [[, doc]] = clientDocs()
    expect(doc).toMatchObject({ clientAuthUid: 'uid-anna@example.com', rank: 'F', xp: 0, coins: 0 })
    expect(db.docs.get(ORG).clientCount).toBe(1)
  })

  it('email/password obbligatorie', async () => {
    setOrg('personal_training')
    await expect(call({ ...ANAGRAFICA })).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(clientDocs()).toEqual([])
  })

  it('audit CLIENT_CREATED con il nome, come prima', async () => {
    setOrg('personal_training')
    await call({ ...ANAGRAFICA, email: 'anna@example.com', password: 'Password1' })
    await flush()
    expect(db.audit[0].details).toMatchObject({ clientName: ANAGRAFICA.name, orgId: 'org1' })
  })
})

describe('creaCliente — modulo non riconosciuto', () => {
  it('rifiuta con failed-precondition senza scrivere', async () => {
    setOrg('modulo_inesistente')
    await expect(call({ ...ANAGRAFICA, email: 'anna@example.com', password: 'Password1' }))
      .rejects.toMatchObject({ code: 'failed-precondition' })
    expect(db.authCreated).toEqual([])
    expect(clientDocs()).toEqual([])
  })
})
