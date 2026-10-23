/**
 * rimuoviMembroTeam — controlli di autorizzazione.
 *
 * requireOrgAdmin verifica solo il chiamante: il bug corretto qui era che l'uid
 * da rimuovere non veniva mai confrontato con i membri dell'org, quindi un
 * org_admin poteva cancellare /users e l'account Auth di chiunque.
 * Admin SDK e firebase-functions sono mockati: si testa solo la logica della callable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  existingDocs:  new Set(),
  batchOps:      [],
  deletedAuth:   [],
  deleteUserErr: null,
}))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { increment: n => ({ increment: n }) },
  getFirestore: () => ({
    doc: path => ({
      path,
      get: async () => ({ exists: state.existingDocs.has(path) }),
    }),
    batch: () => ({
      delete: ref => state.batchOps.push(['delete', ref.path]),
      update: (ref, data) => state.batchOps.push(['update', ref.path, data]),
      commit: async () => {},
    }),
  }),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    deleteUser: async uid => {
      if (state.deleteUserErr) throw state.deleteUserErr
      state.deletedAuth.push(uid)
    },
  }),
}))

// Il chiamante è sempre org_admin di org1: il controllo sul chiamante ha i suoi casi
// in shared/auth.js, qui interessa cosa succede all'uid bersaglio.
vi.mock('../src/shared/auth.js', () => ({
  requireOrgAdmin: async (request, orgId) => {
    if (orgId !== 'org1') {
      const err = new Error('Accesso negato a questa organizzazione')
      err.code = 'permission-denied'
      throw err
    }
    return { role: 'org_admin', orgId: 'org1' }
  },
}))

const { rimuoviMembroTeam } = await import('../src/callable/rimuoviMembroTeam.js')

const call = data => rimuoviMembroTeam({ auth: { uid: 'admin1' }, data })

beforeEach(() => {
  state.existingDocs  = new Set(['organizations/org1/members/trainer1'])
  state.batchOps      = []
  state.deletedAuth   = []
  state.deleteUserErr = null
})

describe('rimuoviMembroTeam', () => {
  it('rimuove un membro della propria org: member, users, counter e account Auth', async () => {
    await expect(call({ orgId: 'org1', uid: 'trainer1' })).resolves.toEqual({ ok: true })
    expect(state.batchOps).toEqual([
      ['delete', 'organizations/org1/members/trainer1'],
      ['delete', 'users/trainer1'],
      ['update', 'organizations/org1', { memberCount: { increment: -1 } }],
    ])
    expect(state.deletedAuth).toEqual(['trainer1'])
  })

  it('rifiuta un uid che non è membro della propria org, senza cancellare nulla', async () => {
    await expect(call({ orgId: 'org1', uid: 'utenteDiOrg2' }))
      .rejects.toMatchObject({ code: 'not-found' })
    expect(state.batchOps).toEqual([])
    expect(state.deletedAuth).toEqual([])
  })

  it('rifiuta l\'uid di un super_admin (non è membro di nessuna org)', async () => {
    await expect(call({ orgId: 'org1', uid: 'superadmin1' }))
      .rejects.toMatchObject({ code: 'not-found' })
    expect(state.deletedAuth).toEqual([])
  })

  it('rifiuta la rimozione di sé stessi', async () => {
    state.existingDocs.add('organizations/org1/members/admin1')
    await expect(call({ orgId: 'org1', uid: 'admin1' }))
      .rejects.toMatchObject({ code: 'failed-precondition' })
    expect(state.batchOps).toEqual([])
  })

  it('rifiuta un orgId diverso da quello del chiamante', async () => {
    await expect(call({ orgId: 'org2', uid: 'trainer1' }))
      .rejects.toMatchObject({ code: 'permission-denied' })
    expect(state.batchOps).toEqual([])
  })

  it('rifiuta input incompleti', async () => {
    await expect(call({ orgId: 'org1' })).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('completa la rimozione anche se l\'account Auth non esiste più', async () => {
    state.deleteUserErr = Object.assign(new Error('missing'), { code: 'auth/user-not-found' })
    await expect(call({ orgId: 'org1', uid: 'trainer1' })).resolves.toEqual({ ok: true })
  })
})
