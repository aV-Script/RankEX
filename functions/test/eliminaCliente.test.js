/**
 * eliminaCliente — cancellazione completa e idempotente (ADR-009, ADR-015 §4, STORY-032).
 *
 * recursiveDelete sul doc cliente cancella ogni subcollection, anche quelle che il
 * codice non conosce per nome (es. assessments) e i loro nipoti; i riferimenti in
 * slot/ricorrenze/gruppi/schede/notifiche spariscono; funziona per un paziente senza
 * account. Se la pulizia si interrompe dopo il batch core, un nuovo eliminaCliente
 * la completa senza decrementare di nuovo clientCount.
 *
 * Admin SDK mockato con uno store in memoria (recursiveDelete e query simulati). Il
 * test su emulatore Firestore reale resta a carico della QA (nessun harness
 * emulatore per functions/ nel repo).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const db = vi.hoisted(() => ({
  docs: new Map(), authDeleted: [], recursive: [], failNextRecursiveDelete: false, denyAccess: false,
  authError: null,
}))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => {
  const depth = path => path.split('/').length
  const docSnap = path => ({ id: path.split('/').pop(), ref: docRef(path), exists: db.docs.has(path), data: () => structuredClone(db.docs.get(path)) })
  const childDocs = path => [...db.docs.keys()].filter(key => key.startsWith(`${path}/`) && depth(key) === depth(path) + 1)

  const matches = (data, [field, op, value]) => op === 'array-contains'
    ? (data[field] ?? []).includes(value)
    : data[field] === value

  function query(path, filters = []) {
    return {
      where: (field, op, value) => query(path, [...filters, [field, op, value]]),
      get:   async () => ({ docs: childDocs(path).filter(key => filters.every(f => matches(db.docs.get(key), f))).map(docSnap) }),
    }
  }
  function collectionRef(path) {
    return { path, id: path.split('/').pop(), ...query(path) }
  }
  function docRef(path) {
    return { path, get: async () => docSnap(path), collection: name => collectionRef(`${path}/${name}`) }
  }
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
      doc:        docRef,
      collection: collectionRef,
      batch: () => {
        const writes = []
        return {
          delete: target => writes.push(() => db.docs.delete(target.path)),
          update: (target, data) => writes.push(() => applyUpdate(target.path, data)),
          commit: async () => writes.forEach(write => write()),
        }
      },
      // Come Firestore: su un doc cancella il doc e tutto l'albero sotto, anche se il
      // doc padre non esiste più.
      recursiveDelete: async target => {
        if (db.failNextRecursiveDelete) {
          db.failNextRecursiveDelete = false
          throw new Error('rete interrotta')
        }
        db.recursive.push(target.path)
        for (const key of [...db.docs.keys()]) {
          if (key === target.path || key.startsWith(`${target.path}/`)) db.docs.delete(key)
        }
      },
    }),
  }
})

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    deleteUser: async uid => {
      if (db.authError) {
        const err = new Error('auth'); err.code = db.authError; throw err
      }
      db.authDeleted.push(uid)
    },
  }),
}))

vi.mock('../src/shared/auth.js', () => ({
  requireOrgAccess: async () => {
    if (db.denyAccess) {
      const err = new Error('Accesso negato'); err.code = 'permission-denied'; throw err
    }
    return { uid: 'trainer1', role: 'trainer', orgId: 'org1' }
  },
}))

const { eliminaCliente } = await import('../src/callable/eliminaCliente.js')

const ORG    = 'organizations/org1'
const CLIENT = `${ORG}/clients/c1`
const call   = () => eliminaCliente({ auth: { uid: 'trainer1' }, data: { orgId: 'org1', clientId: 'c1' } })

function seed(clientData) {
  db.docs.set(ORG, { clientCount: 2 })
  db.docs.set(CLIENT, clientData)
  db.docs.set(`${ORG}/clients/c2`, { name: 'Altro' })
  db.docs.set(`${ORG}/clients/c2/notes/n9`, { text: 'di un altro cliente' })

  // Subcollection del cliente: note per nome, una mai elencata nel codice
  // (assessments) con un nipote, e una ipotetica futura.
  db.docs.set(`${CLIENT}/notes/n1`, { text: 'nota', parentId: null })
  db.docs.set(`${CLIENT}/notes/n2`, { text: 'commento', parentId: 'n1' })
  db.docs.set(`${CLIENT}/goals/g1`, { testKey: 'sprint_10m' })
  db.docs.set(`${CLIENT}/assessments/a1`, { testId: 'two_minute_walk', clinical: { pain: 4 } })
  db.docs.set(`${CLIENT}/assessments/a1/attachments/x1`, { note: 'nipote' })
  db.docs.set(`${CLIENT}/futureCollection/f1`, { any: true })

  db.docs.set(`${ORG}/groups/gr1`,        { name: 'G', clientIds: ['c1', 'c2'] })
  db.docs.set(`${ORG}/slots/s1`,          { clientIds: ['c1', 'c2'], attendees: [], absentees: [] })
  db.docs.set(`${ORG}/slots/s2`,          { clientIds: ['c2'], attendees: ['c1'], absentees: ['c1'] })
  db.docs.set(`${ORG}/recurrences/r1`,    { clientIds: ['c1', 'c2'] })
  db.docs.set(`${ORG}/notifications/nt1`, { clientId: 'c1', message: 'x' })
  db.docs.set(`${ORG}/notifications/nt2`, { clientId: 'c2', message: 'y' })
  db.docs.set(`${ORG}/workoutPlans/w1`,   { clientId: 'c1', title: 'Scheda' })
  db.docs.set(`${ORG}/workoutPlans/w2`,   { clientId: 'c2', title: 'Scheda' })
}

const residualReferences = () => [...db.docs.entries()].filter(([path, data]) =>
  path.startsWith(CLIENT) || JSON.stringify(data).includes('"c1"'))

beforeEach(() => {
  db.docs.clear()
  db.authDeleted             = []
  db.recursive               = []
  db.failNextRecursiveDelete = false
  db.denyAccess              = false
  db.authError               = null
})

describe('eliminaCliente — cancellazione completa', () => {
  it('paziente senza account: doc e ogni subcollection (anche non note per nome) cancellati, nessun residuo', async () => {
    seed({ name: 'Anna', clientAuthUid: null })

    await expect(call()).resolves.toEqual({ ok: true })

    expect(db.recursive).toEqual([CLIENT])
    expect(residualReferences()).toEqual([])
    expect(db.authDeleted).toEqual([])
    expect(db.docs.get(ORG).clientCount).toBe(1)
  })

  it('non tocca i dati degli altri clienti', async () => {
    seed({ name: 'Anna' })
    await call()

    expect(db.docs.has(`${ORG}/clients/c2`)).toBe(true)
    expect(db.docs.has(`${ORG}/clients/c2/notes/n9`)).toBe(true)
    expect(db.docs.get(`${ORG}/groups/gr1`).clientIds).toEqual(['c2'])
    expect(db.docs.get(`${ORG}/slots/s1`).clientIds).toEqual(['c2'])
    expect(db.docs.get(`${ORG}/slots/s2`)).toMatchObject({ clientIds: ['c2'], attendees: [], absentees: [] })
    expect(db.docs.get(`${ORG}/recurrences/r1`).clientIds).toEqual(['c2'])
    expect(db.docs.has(`${ORG}/notifications/nt2`)).toBe(true)
    expect(db.docs.has(`${ORG}/workoutPlans/w2`)).toBe(true)
  })

  it('cliente con account: cancella anche /users e l\'account Auth', async () => {
    seed({ name: 'Marco', clientAuthUid: 'uidC1' })
    db.docs.set('users/uidC1', { role: 'client', orgId: 'org1', clientId: 'c1' })

    await call()

    expect(db.docs.has('users/uidC1')).toBe(false)
    expect(db.authDeleted).toEqual(['uidC1'])
    expect(residualReferences()).toEqual([])
  })

  it('errore Auth transitorio: nessun dato cancellato, il retry conosce ancora l\'uid', async () => {
    seed({ name: 'Marco', clientAuthUid: 'uidC1' })
    db.docs.set('users/uidC1', { role: 'client', orgId: 'org1', clientId: 'c1' })
    db.authError = 'auth/internal-error'

    await expect(call()).rejects.toMatchObject({ code: 'internal' })
    expect(db.docs.has(CLIENT)).toBe(true)
    expect(db.docs.has('users/uidC1')).toBe(true)
    expect(db.docs.get(ORG).clientCount).toBe(2)

    db.authError = null
    await expect(call()).resolves.toEqual({ ok: true })
    expect(db.authDeleted).toEqual(['uidC1'])
    expect(residualReferences()).toEqual([])
    expect(db.docs.get(ORG).clientCount).toBe(1)
  })

  it('account Auth già assente: la cancellazione prosegue', async () => {
    seed({ name: 'Marco', clientAuthUid: 'uidC1' })
    db.authError = 'auth/user-not-found'

    await expect(call()).resolves.toEqual({ ok: true })
    expect(db.docs.has(CLIENT)).toBe(false)
    expect(db.docs.get(ORG).clientCount).toBe(1)
  })
})

describe('eliminaCliente — retry dopo interruzione', () => {
  it('core ok + recursiveDelete fallita → retry completa la pulizia, clientCount decrementato una sola volta', async () => {
    seed({ name: 'Marco', clientAuthUid: 'uidC1' })
    db.docs.set('users/uidC1', { role: 'client', orgId: 'org1', clientId: 'c1' })
    db.failNextRecursiveDelete = true

    await expect(call()).rejects.toThrow('rete interrotta')
    // Account e core già applicati: doc, users/ e account spariti, counter decrementato
    expect(db.docs.has(CLIENT)).toBe(false)
    expect(db.docs.has('users/uidC1')).toBe(false)
    expect(db.authDeleted).toEqual(['uidC1'])
    expect(db.docs.get(ORG).clientCount).toBe(1)
    // ...ma subcollection e riferimenti ancora presenti
    expect(residualReferences().length).toBeGreaterThan(0)

    await expect(call()).resolves.toEqual({ ok: true, alreadyDeleted: true })

    expect(residualReferences()).toEqual([])
    expect(db.docs.get(ORG).clientCount).toBe(1)
    expect(db.authDeleted).toEqual(['uidC1'])
  })

  it('retry: i permessi restano applicati, nessuna pulizia senza accesso all\'org', async () => {
    seed({ name: 'Anna' })
    db.docs.delete(CLIENT)
    db.denyAccess = true

    await expect(call()).rejects.toMatchObject({ code: 'permission-denied' })
    expect(db.recursive).toEqual([])
    expect(db.docs.has(`${CLIENT}/notes/n1`)).toBe(true)
    expect(db.docs.get(`${ORG}/groups/gr1`).clientIds).toContain('c1')
  })

  it('cliente già cancellato senza residui: ok idempotente, nessuna scrittura sul counter', async () => {
    db.docs.set(ORG, { clientCount: 1 })

    await expect(call()).resolves.toEqual({ ok: true, alreadyDeleted: true })
    expect(db.docs.get(ORG).clientCount).toBe(1)
    expect(db.authDeleted).toEqual([])
  })
})
