import { describe, it, expect } from 'vitest'
import {
  getPlanLimits,
  isAtTrainerLimit,
  isAtClientLimit,
  PLAN_LIMITS,
} from '../../config/plans.config.js'

describe('getPlanLimits', () => {
  it('restituisce i limiti del piano free', () => {
    expect(getPlanLimits('free')).toEqual({ trainers: 1, clients: 10, label: 'Free' })
  })

  it('restituisce i limiti del piano pro', () => {
    expect(getPlanLimits('pro')).toEqual({ trainers: 5, clients: 100, label: 'Pro' })
  })

  it('restituisce Infinity per enterprise', () => {
    const limits = getPlanLimits('enterprise')
    expect(limits.trainers).toBe(Infinity)
    expect(limits.clients).toBe(Infinity)
  })

  it('default a free per piano sconosciuto', () => {
    expect(getPlanLimits('unknown')).toEqual(PLAN_LIMITS.free)
  })

  it('default a free se plan è undefined', () => {
    expect(getPlanLimits(undefined)).toEqual(PLAN_LIMITS.free)
  })

  it('default a free se plan è null', () => {
    expect(getPlanLimits(null)).toEqual(PLAN_LIMITS.free)
  })
})

describe('isAtTrainerLimit', () => {
  it('false se sotto il limite', () => {
    expect(isAtTrainerLimit('free', 0)).toBe(false)
  })

  it('true se esattamente al limite (free: 1 trainer)', () => {
    expect(isAtTrainerLimit('free', 1)).toBe(true)
  })

  it('true se sopra il limite', () => {
    expect(isAtTrainerLimit('free', 2)).toBe(true)
  })

  it('false per pro con 4 trainer su 5', () => {
    expect(isAtTrainerLimit('pro', 4)).toBe(false)
  })

  it('true per pro con 5 trainer su 5', () => {
    expect(isAtTrainerLimit('pro', 5)).toBe(true)
  })

  it('mai al limite per enterprise', () => {
    expect(isAtTrainerLimit('enterprise', 999999)).toBe(false)
  })
})

describe('isAtClientLimit', () => {
  it('false se sotto il limite', () => {
    expect(isAtClientLimit('free', 9)).toBe(false)
  })

  it('true se al limite (free: 10 clienti)', () => {
    expect(isAtClientLimit('free', 10)).toBe(true)
  })

  it('false per pro con 99 clienti', () => {
    expect(isAtClientLimit('pro', 99)).toBe(false)
  })

  it('true per pro con 100 clienti', () => {
    expect(isAtClientLimit('pro', 100)).toBe(true)
  })

  it('mai al limite per enterprise', () => {
    expect(isAtClientLimit('enterprise', 999999)).toBe(false)
  })
})
