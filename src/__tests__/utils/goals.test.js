import { describe, it, expect } from 'vitest'
import { isGoalMissed, getGoalDisplayStatus } from '../../utils/goals.js'

const today     = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
const tomorrow  = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

describe('isGoalMissed', () => {
  it('false se status non è active', () => {
    expect(isGoalMissed({ status: 'achieved', deadline: yesterday })).toBe(false)
    expect(isGoalMissed({ status: 'cancelled', deadline: yesterday })).toBe(false)
  })

  it('false se la deadline è oggi o nel futuro', () => {
    expect(isGoalMissed({ status: 'active', deadline: today })).toBe(false)
    expect(isGoalMissed({ status: 'active', deadline: tomorrow })).toBe(false)
  })

  it('true se active e deadline superata', () => {
    expect(isGoalMissed({ status: 'active', deadline: yesterday })).toBe(true)
  })

  it('false se manca la deadline', () => {
    expect(isGoalMissed({ status: 'active', deadline: null })).toBe(false)
  })
})

describe('getGoalDisplayStatus', () => {
  it('restituisce "missed" per un obiettivo attivo scaduto', () => {
    expect(getGoalDisplayStatus({ status: 'active', deadline: yesterday })).toBe('missed')
  })

  it('restituisce lo status salvato negli altri casi', () => {
    expect(getGoalDisplayStatus({ status: 'active', deadline: tomorrow })).toBe('active')
    expect(getGoalDisplayStatus({ status: 'achieved', deadline: yesterday })).toBe('achieved')
    expect(getGoalDisplayStatus({ status: 'cancelled', deadline: yesterday })).toBe('cancelled')
  })
})
