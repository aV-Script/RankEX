import { vi, describe, it, expect } from 'vitest'

// tables.js uses ALL_TESTS as an implicit global (bundler artifact) — mock for node env
vi.mock('./tables.js', () => ({
  getAgeGroup: () => '18-35',
  TABLES: {
    test_direct: {
      M: { '18-35': { 5: 20, 25: 35, 50: 50, 75: 65, 95: 80 } },
    },
    test_inverse: {
      M: { '18-35': { 5: 3.0, 25: 2.5, 50: 2.0, 75: 1.5, 95: 1.0 } },
    },
  },
}))

vi.mock('../constants/index.js', async (importOriginal) => {
  const orig = await importOriginal()
  return {
    ...orig,
    ALL_TESTS: [
      { key: 'test_direct',  stat: 'stat_direct',  direction: 'direct'  },
      { key: 'test_inverse', stat: 'stat_inverse', direction: 'inverse' },
    ],
  }
})

import { calcStatMedia, calcPercentile } from './percentile.js'

// ── calcStatMedia ─────────────────────────────────────────────────────────────

describe('calcStatMedia', () => {
  it('restituisce 0 per oggetto vuoto', () => {
    expect(calcStatMedia({})).toBe(0)
  })

  it('restituisce 0 senza argomenti', () => {
    expect(calcStatMedia()).toBe(0)
  })

  it('restituisce il valore singolo', () => {
    expect(calcStatMedia({ a: 72 })).toBe(72)
  })

  it('calcola la media di più valori', () => {
    expect(calcStatMedia({ a: 40, b: 60 })).toBe(50)
    expect(calcStatMedia({ a: 30, b: 50, c: 70 })).toBe(50)
  })

  it('ignora valori non numerici', () => {
    expect(calcStatMedia({ a: 50, b: 'ciao', c: 70 })).toBe(60)
  })

  it('ignora valori NaN', () => {
    expect(calcStatMedia({ a: 50, b: NaN, c: 70 })).toBe(60)
  })

  it('arrotonda al numero intero più vicino', () => {
    expect(calcStatMedia({ a: 10, b: 21 })).toBe(16)
  })
})

// ── calcPercentile ────────────────────────────────────────────────────────────

describe('calcPercentile', () => {
  it('restituisce null per stat non esistente', () => {
    expect(calcPercentile('stat_inesistente', 50, 'M', 25)).toBeNull()
  })

  it('restituisce null per sesso non presente nella tabella', () => {
    expect(calcPercentile('stat_direct', 50, 'F', 25)).toBeNull()
  })

  it('restituisce un numero per input valido', () => {
    const result = calcPercentile('stat_direct', 50, 'M', 25)
    expect(result).not.toBeNull()
    expect(typeof result).toBe('number')
  })

  it('restituisce un percentile nel range [0, 100]', () => {
    const result = calcPercentile('stat_direct', 50, 'M', 25)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('valore più alto → percentile più alto (direzione direct)', () => {
    const low  = calcPercentile('stat_direct', 20, 'M', 25)
    const high = calcPercentile('stat_direct', 80, 'M', 25)
    expect(high).toBeGreaterThan(low)
  })

  it('valore più basso → percentile più alto (direzione inverse)', () => {
    const fast = calcPercentile('stat_inverse', 1.0, 'M', 25)
    const slow = calcPercentile('stat_inverse', 3.0, 'M', 25)
    expect(fast).toBeGreaterThan(slow)
  })
})
