/**
 * writeAudit non fa mai fallire la callable: se l'add rigetta, logga solo
 * action e code (mai message o details: dati sanitari) e risolve.
 */
import { describe, it, expect, vi } from 'vitest'

const loggerError = vi.hoisted(() => vi.fn())

vi.mock('firebase-functions/v2/https', () => ({ HttpsError: class extends Error {} }))
vi.mock('firebase-functions/logger', () => ({ error: loggerError }))

import { writeAudit } from '../src/shared/actor.js'

const request = { auth: { uid: 'u1', token: { email: 'a@b.it' } } }

describe('writeAudit', () => {
  it('risolve e logga solo action e code quando add rigetta', async () => {
    const err = Object.assign(new Error('dati sensibili nel messaggio'), { code: 'unavailable' })
    const db = { collection: () => ({ add: () => Promise.reject(err) }) }
    await expect(writeAudit(db, request, 'X_ACTION', { clientId: 'c1' })).resolves.toBeUndefined()
    expect(loggerError).toHaveBeenCalledWith('writeAudit fallito', { action: 'X_ACTION', code: 'unavailable' })
  })

  it('scrive la voce in audit_logs', async () => {
    const add = vi.fn().mockResolvedValue({ id: 'a1' })
    const db = { collection: vi.fn(() => ({ add })) }
    await writeAudit(db, request, 'X_ACTION', { clientId: 'c1' })
    expect(db.collection).toHaveBeenCalledWith('audit_logs')
    expect(add.mock.calls[0][0]).toMatchObject({ action: 'X_ACTION', uid: 'u1', details: { clientId: 'c1' } })
  })
})
