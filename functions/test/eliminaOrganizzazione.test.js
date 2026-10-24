/**
 * eliminaOrganizzazione — cancellazione completa di un'org a fine contratto.
 * Admin SDK e firebase-functions sono mockati: si testa solo la logica della callable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  org:          null,
  members:      [],
  clients:      [],
  users:        [],
  deletedAuth:  [],
  deletedDocs:  [],
  recursive:    [],
  authFailIdx:  [],
}))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

const snap = docs => ({ docs: docs.map(([id, data]) => ({ id, data: () => data })), size: docs.length })

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    doc: path => ({
      path,
      get: async () => ({ exists: !!state.org, data: () => state.org }),
      collection: name => ({ get: async () => snap(name === 'members' ? state.members : state.clients) }),
    }),
    collection: () => ({ where: () => ({ get: async () => snap(state.users) }) }),
    batch: () => ({
      delete: ref => state.deletedDocs.push(ref.path),
      commit: async () => {},
    }),
    recursiveDelete: async ref => { state.recursive.push(ref.path) },
  }),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    deleteUsers: async uids => {
      state.deletedAuth.push(...uids)
      const errors = state.authFailIdx.map(index => ({ index }))
      return { successCount: uids.length - errors.length, errors }
    },
  }),
}))

vi.mock('../src/shared/auth.js', () => ({
  requireRole: async (request, roles) => {
    if (!roles.includes(request.auth.role)) {
      const err = new Error('Ruolo richiesto'); err.code = 'permission-denied'; throw err
    }
    return { uid: request.auth.uid, role: request.auth.role }
  },
}))

const { eliminaOrganizzazione } = await import('../src/callable/eliminaOrganizzazione.js')

const call = (data, auth = { uid: 'admin1', role: 'super_admin' }) => eliminaOrganizzazione({ auth, data })

beforeEach(() => {
  state.org         = { name: 'Accademia Test' }
  state.members     = [['coach1', { role: 'org_admin' }], ['coach2', { role: 'trainer' }]]
  state.clients     = [['c1', { clientAuthUid: 'atleta1' }], ['c2', {}]]
  state.users       = [['coach1', { role: 'org_admin' }], ['atleta1', { role: 'client' }], ['admin1', { role: 'super_admin' }], ['owner', { role: 'super_admin' }]]
  state.deletedAuth = []
  state.deletedDocs = []
  state.recursive   = []
  state.authFailIdx = []
})

describe('eliminaOrganizzazione', () => {
  it('rifiuta chi non è super_admin', async () => {
    await expect(call({ orgId: 'org1', confirmName: 'Accademia Test' }, { uid: 'coach1', role: 'org_admin' }))
      .rejects.toMatchObject({ code: 'permission-denied' })
    expect(state.recursive).toEqual([])
  })

  it('rifiuta se il nome di conferma non corrisponde', async () => {
    await expect(call({ orgId: 'org1', confirmName: 'Accademia' }))
      .rejects.toMatchObject({ code: 'failed-precondition' })
    expect(state.deletedAuth).toEqual([])
    expect(state.recursive).toEqual([])
  })

  it('org inesistente: not-found', async () => {
    state.org = null
    await expect(call({ orgId: 'org1', confirmName: 'x' })).rejects.toMatchObject({ code: 'not-found' })
  })

  it('cancella account, /users e org, senza toccare i super_admin', async () => {
    const res = await call({ orgId: 'org1', confirmName: ' Accademia Test ' })
    expect(state.deletedAuth.sort()).toEqual(['atleta1', 'coach1', 'coach2'])
    expect(state.deletedDocs.sort()).toEqual(['users/atleta1', 'users/coach1', 'users/coach2'])
    expect(state.recursive).toEqual(['organizations/org1'])
    expect(res).toMatchObject({ ok: true, accounts: 3, members: 2, clients: 2 })
  })

  it('se un account non si cancella si ferma prima dei dati, così si può rilanciare', async () => {
    state.authFailIdx = [0]
    await expect(call({ orgId: 'org1', confirmName: 'Accademia Test' })).rejects.toMatchObject({ code: 'internal' })
    expect(state.deletedDocs).toEqual([])
    expect(state.recursive).toEqual([])
  })
})
