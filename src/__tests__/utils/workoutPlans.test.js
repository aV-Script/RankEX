import { describe, it, expect } from 'vitest'
import { normalizePlanDays, pickActivePlan, sortPlansByCreatedAtDesc } from '../../utils/workoutPlans'

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
