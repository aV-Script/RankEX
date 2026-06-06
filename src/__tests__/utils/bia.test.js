import { describe, it, expect } from 'vitest'
import { calcBmi, calcBiaXP, calcBiaScore, getBiaParamStatus } from '../../utils/bia.js'

// ── calcBmi ───────────────────────────────────────────────────────────────────
describe('calcBmi', () => {
  it('calcola BMI corretto (75kg, 180cm → 23.1)', () => {
    expect(calcBmi(75, 180)).toBe(23.1)
  })

  it('arrotonda a 1 decimale', () => {
    const bmi = calcBmi(80, 175)
    expect(bmi).toBe(26.1)
  })

  it('restituisce null se peso mancante', () => {
    expect(calcBmi(null, 180)).toBeNull()
    expect(calcBmi(0, 180)).toBeNull()
  })

  it('restituisce null se altezza mancante', () => {
    expect(calcBmi(75, null)).toBeNull()
    expect(calcBmi(75, 0)).toBeNull()
  })
})

// ── calcBiaXP (US-046) ────────────────────────────────────────────────────────
describe('calcBiaXP', () => {
  it('50 XP per la prima misurazione (prevBia = null)', () => {
    expect(calcBiaXP({ fatMassPercent: 20 }, null)).toBe(50)
  })

  it('100 XP se tutti e 4 i parametri chiave migliorano', () => {
    const prev = { fatMassPercent: 25, muscleMassKg: 30, waterPercent: 55, visceralFat: 8 }
    const curr = { fatMassPercent: 22, muscleMassKg: 32, waterPercent: 57, visceralFat: 6 }
    expect(calcBiaXP(curr, prev)).toBe(100)
  })

  it('60 XP per 2 parametri migliorati', () => {
    const prev = { fatMassPercent: 25, muscleMassKg: 30, waterPercent: 55, visceralFat: 8 }
    const curr = { fatMassPercent: 22, muscleMassKg: 32, waterPercent: 55, visceralFat: 8 }
    expect(calcBiaXP(curr, prev)).toBe(60)
  })

  it('30 XP per 1 parametro migliorato', () => {
    const prev = { fatMassPercent: 25, muscleMassKg: 30, waterPercent: 55, visceralFat: 8 }
    const curr = { fatMassPercent: 22, muscleMassKg: 30, waterPercent: 55, visceralFat: 8 }
    expect(calcBiaXP(curr, prev)).toBe(30)
  })

  it('10 XP se nessun parametro migliora', () => {
    const prev = { fatMassPercent: 20, muscleMassKg: 35, waterPercent: 60, visceralFat: 5 }
    const curr = { fatMassPercent: 22, muscleMassKg: 33, waterPercent: 58, visceralFat: 7 }
    expect(calcBiaXP(curr, prev)).toBe(10)
  })

  it('fatMassPercent e visceralFat: miglioramento = valore scende', () => {
    const prev = { fatMassPercent: 25, muscleMassKg: 30, waterPercent: 55, visceralFat: 8 }
    // fatMass sale (peggioramento), visceralFat scende (miglioramento)
    const curr = { fatMassPercent: 27, muscleMassKg: 30, waterPercent: 55, visceralFat: 6 }
    expect(calcBiaXP(curr, prev)).toBe(30) // 1 miglioramento
  })

  it('ignora parametri null', () => {
    const prev = { fatMassPercent: null, muscleMassKg: 30, waterPercent: 55, visceralFat: 8 }
    const curr = { fatMassPercent: null, muscleMassKg: 32, waterPercent: 55, visceralFat: 8 }
    expect(calcBiaXP(curr, prev)).toBe(30) // solo muscleMassKg migliorata
  })
})

// ── getBiaParamStatus ─────────────────────────────────────────────────────────
describe('getBiaParamStatus', () => {
  it('restituisce neutro per valore null/vuoto', () => {
    const r = getBiaParamStatus('fatMassPercent', null, 'M', 30)
    expect(r.label).toBe('—')
  })

  it('BMI normopeso (22) → score alto', () => {
    const r = getBiaParamStatus('bmi', 22, 'M', 30)
    expect(r.score).toBeGreaterThan(50)
  })

  it('BMI obeso (35) → score basso', () => {
    const r = getBiaParamStatus('bmi', 35, 'M', 30)
    expect(r.score).toBeLessThan(40)
  })

  it('età metabolica inferiore all\'età reale → eccellente', () => {
    const r = getBiaParamStatus('metabolicAge', 22, 'M', 30) // 8 anni più giovane
    expect(r.label).toBe('Ottima')
    expect(r.score).toBe(85)
  })

  it('età metabolica uguale all\'età reale → normale', () => {
    const r = getBiaParamStatus('metabolicAge', 30, 'M', 30)
    expect(r.label).toBe('Normale')
  })

  it('grasso viscerale basso (3) → colore positivo', () => {
    const r = getBiaParamStatus('visceralFat', 3, 'M', 30)
    expect(r.score).toBeGreaterThan(50)
  })

  it('grasso viscerale alto (12) → score basso', () => {
    const r = getBiaParamStatus('visceralFat', 12, 'M', 30)
    expect(r.score).toBeLessThan(30)
  })

  it('parametri neutri (muscleMassKg) → score 65', () => {
    const r = getBiaParamStatus('muscleMassKg', 35, 'M', 30)
    expect(r.score).toBe(65)
    expect(r.label).toBe('35')
  })
})

// ── calcBiaScore ──────────────────────────────────────────────────────────────
describe('calcBiaScore', () => {
  it('restituisce 0 per BIA nulla', () => {
    expect(calcBiaScore(null, 'M', 30)).toBe(0)
  })

  it('restituisce 0 per BIA senza parametri chiave', () => {
    expect(calcBiaScore({ muscleMassKg: 35 }, 'M', 30)).toBe(0)
  })

  it('restituisce un numero 0-100 per BIA completa', () => {
    const bia = { fatMassPercent: 18, waterPercent: 60, visceralFat: 4, bmi: 22 }
    const score = calcBiaScore(bia, 'M', 30)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('score BIA ottimale > score BIA critica', () => {
    const good = { fatMassPercent: 12, waterPercent: 65, visceralFat: 2, bmi: 22 }
    const bad  = { fatMassPercent: 40, waterPercent: 45, visceralFat: 12, bmi: 38 }
    expect(calcBiaScore(good, 'M', 30)).toBeGreaterThan(calcBiaScore(bad, 'M', 30))
  })
})
