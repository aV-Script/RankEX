import { describe, it, expect } from 'vitest'
import { normalizePlanDays, pickActivePlan, sortPlansByCreatedAtDesc, getPlanProgress } from '../../utils/workoutPlans'

describe('normalizePlanDays', () => {
  it('restituisce days invariato quando già presente e non vuoto', () => {
    const plan = { days: [{ label: 'Giorno 1', exercises: [{ name: 'Squat' }] }] }
    expect(normalizePlanDays(plan)).toBe(plan.days)
  })

  it('avvolge il vecchio formato exercises[] flat in un unico "Giorno 1"', () => {
    const plan = { exercises: [{ name: 'Panca' }, { name: 'Stacco' }] }
    expect(normalizePlanDays(plan)).toEqual([
      { label: 'Giorno 1', exercises: [{ name: 'Panca' }, { name: 'Stacco' }] },
    ])
  })

  it('con days: [] (vuoto) ricade sul formato legacy', () => {
    const plan = { days: [], exercises: [{ name: 'Affondi' }] }
    expect(normalizePlanDays(plan)).toEqual([
      { label: 'Giorno 1', exercises: [{ name: 'Affondi' }] },
    ])
  })

  it('con scheda senza days né exercises restituisce un giorno vuoto', () => {
    expect(normalizePlanDays({})).toEqual([{ label: 'Giorno 1', exercises: [] }])
  })
})

describe('pickActivePlan', () => {
  it('trova la scheda con status active', () => {
    const plans = [
      { id: '1', status: 'archived' },
      { id: '2', status: 'active' },
    ]
    expect(pickActivePlan(plans)?.id).toBe('2')
  })

  it('restituisce null se nessuna scheda è attiva', () => {
    expect(pickActivePlan([{ id: '1', status: 'archived' }])).toBeNull()
  })

  it('con lista vuota restituisce null', () => {
    expect(pickActivePlan([])).toBeNull()
  })
})

describe('sortPlansByCreatedAtDesc', () => {
  it('ordina dalla più recente alla più vecchia', () => {
    const plans = [
      { id: 'old', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'new', createdAt: '2026-03-01T00:00:00.000Z' },
      { id: 'mid', createdAt: '2026-02-01T00:00:00.000Z' },
    ]
    expect(sortPlansByCreatedAtDesc(plans).map(p => p.id)).toEqual(['new', 'mid', 'old'])
  })

  it('non muta l\'array originale', () => {
    const plans = [
      { id: 'a', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', createdAt: '2026-02-01T00:00:00.000Z' },
    ]
    const original = [...plans]
    sortPlansByCreatedAtDesc(plans)
    expect(plans).toEqual(original)
  })
})

describe('getPlanProgress', () => {
  const days = [{ label: 'A', exercises: [] }, { label: 'B', exercises: [] }, { label: 'C', exercises: [] }]

  it('scheda nuova: 0 sessioni, si parte dal primo giorno', () => {
    expect(getPlanProgress({ days })).toEqual({ done: 0, target: null, pct: null, completed: false, nextDayIndex: 0 })
  })

  it('il giorno consigliato ruota sui giorni della scheda', () => {
    expect(getPlanProgress({ days, completedSessions: 1 }).nextDayIndex).toBe(1)
    expect(getPlanProgress({ days, completedSessions: 3 }).nextDayIndex).toBe(0)
    expect(getPlanProgress({ days, completedSessions: 5 }).nextDayIndex).toBe(2)
  })

  it('percentuale sulle sessioni previste, mai oltre 100', () => {
    expect(getPlanProgress({ days, targetSessions: 12, completedSessions: 3 }).pct).toBe(25)
    expect(getPlanProgress({ days, targetSessions: 4, completedSessions: 6 }).pct).toBe(100)
  })

  it('completata solo quando il server ha scritto completedAt', () => {
    expect(getPlanProgress({ days, targetSessions: 2, completedSessions: 2 }).completed).toBe(false)
    expect(getPlanProgress({ days, targetSessions: 2, completedSessions: 2, completedAt: '2026-10-24' }).completed).toBe(true)
  })

  it('schede vecchie con exercises flat: un solo giorno', () => {
    expect(getPlanProgress({ exercises: [], completedSessions: 4 }).nextDayIndex).toBe(0)
  })
})
