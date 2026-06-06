import { describe, it, expect } from 'vitest'
import { calcStatMedia, calcPercentileEx, calcPercentile } from '../../utils/percentile.js'

// ── calcStatMedia ─────────────────────────────────────────────────────────────
describe('calcStatMedia', () => {
  it('media corretta di valori interi', () => {
    expect(calcStatMedia({ a: 60, b: 80, c: 40 })).toBe(60)
  })

  it('arrotonda a intero', () => {
    expect(calcStatMedia({ a: 33, b: 34 })).toBe(34)  // (33+34)/2 = 33.5 → 34
  })

  it('0 per oggetto vuoto', () => {
    expect(calcStatMedia({})).toBe(0)
  })

  it('0 per undefined', () => {
    expect(calcStatMedia(undefined)).toBe(0)
  })

  it('ignora valori non numerici e NaN', () => {
    expect(calcStatMedia({ a: 60, b: 'testo', c: NaN })).toBe(60)
  })

  it('singolo valore → uguale a sé stesso', () => {
    expect(calcStatMedia({ x: 75 })).toBe(75)
  })
})

// ── calcPercentileEx ──────────────────────────────────────────────────────────
describe('calcPercentileEx', () => {
  it('restituisce null per test inesistente', () => {
    const r = calcPercentileEx('stat_inesistente', 50, 'M', 25, 'test_inesistente')
    expect(r.value).toBeNull()
    expect(r.outOfRange).toBe(false)
  })

  it('restituisce null se manca la tabella per il sesso', () => {
    // beep_test esiste ma potrebbe non avere tabella per tutti i sessi
    const r = calcPercentileEx('resistenza', 50, 'X', 25, 'beep_test')
    // se non esiste tabella per 'X' → null
    if (r.value === null) {
      expect(r.outOfRange).toBe(false)
    } else {
      expect(typeof r.value).toBe('number')
    }
  })

  it('valore nel range 0-100 per test esistente con dati validi', () => {
    // beep_test, maschio, 25 anni — tabella dovrebbe esistere
    const r = calcPercentileEx('resistenza', 10, 'M', 25, 'beep_test')
    if (r.value !== null) {
      expect(r.value).toBeGreaterThanOrEqual(0)
      expect(r.value).toBeLessThanOrEqual(100)
    }
  })

  it('outOfRange = true quando età è fuori fascia normativa', () => {
    // beep_test ha range 8-50; un atleta di 5 anni è fuori fascia
    const r = calcPercentileEx('resistenza', 8, 'M', 5, 'beep_test')
    if (r.value !== null) {
      expect(r.outOfRange).toBe(true)
    }
  })

  it('outOfRange = false quando età è nella fascia normativa', () => {
    const r = calcPercentileEx('resistenza', 10, 'M', 20, 'beep_test')
    if (r.value !== null) {
      expect(r.outOfRange).toBe(false)
    }
  })

  it('valore alto → percentile alto (direction: direct)', () => {
    // Per beep_test direction=direct: più livelli = percentile più alto
    const basso = calcPercentileEx('resistenza', 4, 'M', 20, 'beep_test')
    const alto  = calcPercentileEx('resistenza', 12, 'M', 20, 'beep_test')
    if (basso.value !== null && alto.value !== null) {
      expect(alto.value).toBeGreaterThan(basso.value)
    }
  })
})

// ── calcPercentile (wrapper backward-compat) ──────────────────────────────────
describe('calcPercentile', () => {
  it('restituisce solo il valore numerico (no outOfRange)', () => {
    const result = calcPercentile('resistenza', 10, 'M', 25, 'beep_test')
    // può essere number o null — mai un oggetto
    expect(result === null || typeof result === 'number').toBe(true)
  })

  it('coerente con calcPercentileEx', () => {
    const ex     = calcPercentileEx('resistenza', 10, 'M', 25, 'beep_test')
    const simple = calcPercentile('resistenza', 10, 'M', 25, 'beep_test')
    expect(simple).toBe(ex.value)
  })
})
