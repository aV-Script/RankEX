import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateAge,
  validateRequired,
  validateNumber,
} from './validation.js'

// ── validateEmail ─────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('accetta email valida', () => {
    expect(validateEmail('utente@esempio.it')).toEqual({ valid: true, error: null })
  })

  it('errore per email vuota', () => {
    expect(validateEmail('')).toMatchObject({ valid: false })
    expect(validateEmail(null)).toMatchObject({ valid: false })
    expect(validateEmail(undefined)).toMatchObject({ valid: false })
  })

  it('errore per email senza @', () => {
    expect(validateEmail('utentesenzachiocciola.it')).toMatchObject({ valid: false })
  })

  it('errore per email senza dominio', () => {
    expect(validateEmail('utente@')).toMatchObject({ valid: false })
  })

  it('errore per email con spazi', () => {
    expect(validateEmail('   ')).toMatchObject({ valid: false })
  })
})

// ── validatePassword ──────────────────────────────────────────────────────────

describe('validatePassword', () => {
  it('accetta password valida (≥8 caratteri + numero)', () => {
    expect(validatePassword('Password1')).toEqual({ valid: true, error: null })
    expect(validatePassword('abc12345')).toEqual({ valid: true, error: null })
  })

  it('errore per password vuota o assente', () => {
    expect(validatePassword('')).toMatchObject({ valid: false })
    expect(validatePassword(null)).toMatchObject({ valid: false })
  })

  it('errore per password < 8 caratteri', () => {
    const result = validatePassword('abc123')
    expect(result).toMatchObject({ valid: false })
    expect(result.error).toBe('Minimo 8 caratteri')
  })

  it('errore per password senza numeri', () => {
    const result = validatePassword('solotesto')
    expect(result).toMatchObject({ valid: false })
    expect(result.error).toContain('numero')
  })

  it('accetta password con almeno 8 caratteri e un numero', () => {
    expect(validatePassword('aaaaaaaa1')).toMatchObject({ valid: true })
  })
})

// ── validateAge ───────────────────────────────────────────────────────────────

describe('validateAge', () => {
  it('accetta età valida', () => {
    expect(validateAge(25)).toEqual({ valid: true, error: null })
    expect(validateAge(16)).toEqual({ valid: true, error: null })
    expect(validateAge(100)).toEqual({ valid: true, error: null })
  })

  it('errore per età vuota/null/undefined', () => {
    expect(validateAge('')).toMatchObject({ valid: false, error: 'Età obbligatoria' })
    expect(validateAge(null)).toMatchObject({ valid: false })
    expect(validateAge(undefined)).toMatchObject({ valid: false })
  })

  it('errore per età < 16', () => {
    expect(validateAge(15)).toMatchObject({ valid: false })
    expect(validateAge(0)).toMatchObject({ valid: false })
  })

  it('errore per età > 100', () => {
    expect(validateAge(101)).toMatchObject({ valid: false })
  })

  it('errore per valore non numerico', () => {
    expect(validateAge('abc')).toMatchObject({ valid: false })
  })
})

// ── validateRequired ──────────────────────────────────────────────────────────

describe('validateRequired', () => {
  it('accetta valore non vuoto', () => {
    expect(validateRequired('Mario')).toEqual({ valid: true, error: null })
    expect(validateRequired(42)).toEqual({ valid: true, error: null })
  })

  it('errore per valore vuoto', () => {
    expect(validateRequired('')).toMatchObject({ valid: false })
    expect(validateRequired('   ')).toMatchObject({ valid: false })
    expect(validateRequired(null)).toMatchObject({ valid: false })
  })

  it('usa il label nel messaggio di errore', () => {
    const result = validateRequired('', 'Nome')
    expect(result.error).toContain('Nome')
  })
})

// ── validateNumber ────────────────────────────────────────────────────────────

describe('validateNumber', () => {
  it('accetta numero valido', () => {
    expect(validateNumber(50)).toEqual({ valid: true, error: null })
    expect(validateNumber('50')).toEqual({ valid: true, error: null })
  })

  it('errore per valore vuoto/null/undefined', () => {
    expect(validateNumber('')).toMatchObject({ valid: false })
    expect(validateNumber(null)).toMatchObject({ valid: false })
    expect(validateNumber(undefined)).toMatchObject({ valid: false })
  })

  it('errore per valore non numerico', () => {
    expect(validateNumber('abc')).toMatchObject({ valid: false })
  })

  it('errore per valore < min', () => {
    const result = validateNumber(5, { min: 10 })
    expect(result).toMatchObject({ valid: false })
    expect(result.error).toContain('10')
  })

  it('errore per valore > max', () => {
    const result = validateNumber(150, { max: 100 })
    expect(result).toMatchObject({ valid: false })
    expect(result.error).toContain('100')
  })

  it('accetta valore nel range [min, max]', () => {
    expect(validateNumber(50, { min: 0, max: 100 })).toEqual({ valid: true, error: null })
    expect(validateNumber(0, { min: 0, max: 100 })).toEqual({ valid: true, error: null })
    expect(validateNumber(100, { min: 0, max: 100 })).toEqual({ valid: true, error: null })
  })

  it('usa il label nel messaggio di errore', () => {
    const result = validateNumber(null, { label: 'Peso' })
    expect(result.error).toContain('Peso')
  })
})
