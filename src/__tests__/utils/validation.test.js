import { describe, it, expect } from 'vitest'
import {
  calcAge,
  validateBirthDate,
  validateEmail,
  validatePassword,
  validateAge,
  validateRequired,
  validateNumber,
} from '../../utils/validation.js'

// ── calcAge ───────────────────────────────────────────────────────────────────
describe('calcAge', () => {
  it('restituisce null per input vuoto', () => {
    expect(calcAge(null)).toBeNull()
    expect(calcAge(undefined)).toBeNull()
    expect(calcAge('')).toBeNull()
  })

  it('restituisce null per data non valida', () => {
    expect(calcAge('non-una-data')).toBeNull()
  })

  it('calcola età corretta', () => {
    const today = new Date()
    const birth = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate())
    expect(calcAge(birth.toISOString().slice(0, 10))).toBe(25)
  })

  it('non incrementa se il compleanno non è ancora passato quest\'anno', () => {
    const today    = new Date()
    const nextYear = today.getFullYear() - 25
    const future   = new Date(nextYear, today.getMonth() + 1, 1)
    if (future.getMonth() <= 11) {
      const age = calcAge(future.toISOString().slice(0, 10))
      expect(age).toBe(24)
    }
  })
})

// ── validateBirthDate ─────────────────────────────────────────────────────────
describe('validateBirthDate', () => {
  it('errore se vuota', () => {
    expect(validateBirthDate(null).valid).toBe(false)
    expect(validateBirthDate('').valid).toBe(false)
  })

  it('errore se data nel futuro', () => {
    const future = new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10)
    expect(validateBirthDate(future).valid).toBe(false)
  })

  it('errore per età < 3', () => {
    const tooYoung = new Date(Date.now() - 86400000 * 100).toISOString().slice(0, 10)
    expect(validateBirthDate(tooYoung).valid).toBe(false)
  })

  it('valida per un adulto 30enne', () => {
    const today = new Date()
    const birth = new Date(today.getFullYear() - 30, 0, 1).toISOString().slice(0, 10)
    expect(validateBirthDate(birth).valid).toBe(true)
  })
})

// ── validateEmail ─────────────────────────────────────────────────────────────
describe('validateEmail', () => {
  it('valida email corretta', () => {
    expect(validateEmail('mario@esempio.it').valid).toBe(true)
    expect(validateEmail('a.b+tag@sub.domain.org').valid).toBe(true)
  })

  it('errore per email vuota', () => {
    expect(validateEmail('').valid).toBe(false)
    expect(validateEmail(null).valid).toBe(false)
  })

  it('errore per formato non valido', () => {
    expect(validateEmail('non-è-una-email').valid).toBe(false)
    expect(validateEmail('manca@dominio').valid).toBe(false)
    expect(validateEmail('@dominio.it').valid).toBe(false)
  })
})

// ── validatePassword (US-003) ─────────────────────────────────────────────────
describe('validatePassword', () => {
  it('valida password corretta', () => {
    expect(validatePassword('Sicura1!').valid).toBe(true)
    expect(validatePassword('Password123').valid).toBe(true)
  })

  it('errore se vuota', () => {
    expect(validatePassword(null).valid).toBe(false)
    expect(validatePassword('').valid).toBe(false)
  })

  it('errore se troppo corta (< 8 caratteri)', () => {
    const r = validatePassword('Ab1')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/8/)
  })

  it('errore se manca il numero', () => {
    const r = validatePassword('SoloLettere')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/numero/i)
  })

  it('errore se manca la maiuscola', () => {
    const r = validatePassword('solomin1scole')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/maiuscola/i)
  })

  it('errore per password con sola maiuscola ma senza numero', () => {
    expect(validatePassword('SOLOSOLO').valid).toBe(false)
  })
})

// ── validateAge ───────────────────────────────────────────────────────────────
describe('validateAge', () => {
  it('valida età 16-100', () => {
    expect(validateAge(16).valid).toBe(true)
    expect(validateAge(50).valid).toBe(true)
    expect(validateAge(100).valid).toBe(true)
  })

  it('errore per età < 16', () => {
    expect(validateAge(15).valid).toBe(false)
  })

  it('errore per età > 100', () => {
    expect(validateAge(101).valid).toBe(false)
  })

  it('errore per valore vuoto', () => {
    expect(validateAge('').valid).toBe(false)
    expect(validateAge(null).valid).toBe(false)
  })

  it('errore per non-numero', () => {
    expect(validateAge('abc').valid).toBe(false)
  })
})

// ── validateRequired ──────────────────────────────────────────────────────────
describe('validateRequired', () => {
  it('valido se ha contenuto', () => {
    expect(validateRequired('Mario').valid).toBe(true)
    expect(validateRequired('0').valid).toBe(true)
  })

  it('errore per stringa vuota', () => {
    expect(validateRequired('').valid).toBe(false)
    expect(validateRequired('   ').valid).toBe(false)
  })

  it('errore per null/undefined', () => {
    expect(validateRequired(null).valid).toBe(false)
    expect(validateRequired(undefined).valid).toBe(false)
  })

  it('include il label nel messaggio di errore', () => {
    const r = validateRequired('', 'Nome')
    expect(r.error).toContain('Nome')
  })
})

// ── validateNumber ────────────────────────────────────────────────────────────
describe('validateNumber', () => {
  it('valido per numero nel range', () => {
    expect(validateNumber(50, { min: 0, max: 100 }).valid).toBe(true)
  })

  it('errore per valore sotto il minimo', () => {
    expect(validateNumber(-1, { min: 0 }).valid).toBe(false)
  })

  it('errore per valore sopra il massimo', () => {
    expect(validateNumber(101, { max: 100 }).valid).toBe(false)
  })

  it('errore per non-numero', () => {
    expect(validateNumber('abc').valid).toBe(false)
  })

  it('errore per valore vuoto', () => {
    expect(validateNumber(null).valid).toBe(false)
    expect(validateNumber('').valid).toBe(false)
  })
})
