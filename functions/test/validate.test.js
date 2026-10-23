/**
 * shared/validate.js — controlli sull'input delle callable.
 * L'Admin SDK non passa da firestore.rules: questi helper sono l'unica barriera
 * su formato degli id, tipi e campi scrivibili.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code }
  }
  return { HttpsError }
})

const {
  assertIdsInData, requireNumber, optionalString, pickAllowed, requireValidPassword,
} = await import('../src/shared/validate.js')

const invalid = { code: 'invalid-argument' }

describe('assertIdsInData', () => {
  it('accetta id Firestore normali, null e campi che non sono id', () => {
    expect(() => assertIdsInData({
      orgId: 'vdp5-ab12c', clientId: 'Xy_9-z', parentId: null, clientIds: ['a', 'b'],
      testKey: 'sprint/20m', text: 'qualsiasi / testo',
    })).not.toThrow()
  })

  it.each([
    ['clientId con "/"', { clientId: 'x/notes/y' }],
    ['uid con "/"',      { uid: '../users/admin' }],
    ['id vuoto',         { slotId: '' }],
    ['id numerico',      { groupId: 42 }],
    ['*Ids non array',   { clientIds: 'a,b' }],
    ['*Ids con "/"',     { attendeeIds: ['ok', 'a/b'] }],
  ])('rifiuta %s', (_label, data) => {
    expect(() => assertIdsInData(data)).toThrow(expect.objectContaining(invalid))
  })
})

describe('requireNumber', () => {
  it('accetta un intero nell\'intervallo', () => {
    expect(requireNumber(50, 'xp', { min: 1, max: 1000, integer: true })).toBe(50)
  })
  it.each([['stringa', '50'], ['NaN', NaN], ['decimale', 1.5], ['sotto il minimo', 0], ['sopra il massimo', 5000]])(
    'rifiuta %s', (_label, value) => {
      expect(() => requireNumber(value, 'xp', { min: 1, max: 1000, integer: true })).toThrow(expect.objectContaining(invalid))
    })
})

describe('optionalString', () => {
  it('normalizza i valori assenti a stringa vuota', () => {
    expect(optionalString(undefined, 'note', 10)).toBe('')
    expect(optionalString(null, 'note', 10)).toBe('')
  })
  it('rifiuta non-stringhe e testi troppo lunghi', () => {
    expect(() => optionalString(123, 'note', 10)).toThrow(expect.objectContaining(invalid))
    expect(() => optionalString('x'.repeat(11), 'note', 10)).toThrow(expect.objectContaining(invalid))
  })
})

describe('pickAllowed', () => {
  it('scarta i campi non ammessi (es. coins/badges in creaCliente)', () => {
    expect(pickAllowed({ name: 'A', coins: 9999, badges: { x: 1 } }, ['name'])).toEqual({ name: 'A' })
  })
  it('rifiuta dati che non sono un oggetto', () => {
    expect(() => pickAllowed(null, ['name'])).toThrow(expect.objectContaining(invalid))
    expect(() => pickAllowed(['name'], ['name'])).toThrow(expect.objectContaining(invalid))
  })
})

describe('requireValidPassword (stessa policy di src/utils/validation.js)', () => {
  it('accetta 8+ caratteri con numero e maiuscola', () => {
    expect(requireValidPassword('Password1')).toBe('Password1')
  })
  it.each(['Pass1', 'password1', 'Password', 123456789])('rifiuta %s', (pwd) => {
    expect(() => requireValidPassword(pwd)).toThrow(expect.objectContaining(invalid))
  })
})
