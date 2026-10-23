/**
 * segnaAllLette — un cliente segna lette solo le proprie notifiche.
 * Prima bastava passare il clientId di un altro cliente della stessa org.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({ profile: null, updated: [] }))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      where: () => ({
        where: () => ({
          get: async () => ({ empty: false, size: 1, docs: [{ ref: { path: 'n1' } }] }),
        }),
      }),
    }),
    batch: () => ({
      update: (ref) => state.updated.push(ref.path),
      commit: async () => {},
    }),
  }),
}))

vi.mock('../src/shared/auth.js', () => ({
  requireOrgMemberOrClient: async () => state.profile,
}))

const { segnaAllLette } = await import('../src/callable/segnaAllLette.js')
const call = clientId => segnaAllLette({ auth: { uid: 'u' }, data: { orgId: 'org1', clientId } })

beforeEach(() => { state.updated = [] })

describe('segnaAllLette', () => {
  it('il cliente segna lette le proprie notifiche', async () => {
    state.profile = { role: 'client', orgId: 'org1', clientId: 'c1' }
    await expect(call('c1')).resolves.toMatchObject({ ok: true, count: 1 })
    expect(state.updated).toEqual(['n1'])
  })

  it('il cliente NON può segnare lette le notifiche di un altro cliente', async () => {
    state.profile = { role: 'client', orgId: 'org1', clientId: 'c1' }
    await expect(call('c2')).rejects.toMatchObject({ code: 'permission-denied' })
    expect(state.updated).toEqual([])
  })

  it('staff_readonly non scrive', async () => {
    state.profile = { role: 'staff_readonly', orgId: 'org1' }
    await expect(call('c1')).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('il trainer può segnare lette le notifiche di un suo cliente', async () => {
    state.profile = { role: 'trainer', orgId: 'org1' }
    await expect(call('c1')).resolves.toMatchObject({ ok: true })
  })
})
