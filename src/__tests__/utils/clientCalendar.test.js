/**
 * STORY-047 — stato sessione per il cliente, riepilogo mese, prossime sessioni.
 */
import { describe, it, expect } from 'vitest'
import {
  getClientSlotState, calcClientMonthSummary, formatUpcomingDate,
} from '../../utils/calendarUtils.js'
import { calcStreakMultiplier, calcSessionXP } from '../../utils/gamification.js'

const ID = 'c1'

describe('getClientSlotState', () => {
  it('presente = completed', () => {
    expect(getClientSlotState({ status: 'completed', attendees: [ID] }, ID)).toBe('completed')
  })
  it('chiusa con il cliente tra gli assenti = absent', () => {
    expect(getClientSlotState({ status: 'completed', attendees: [], absentees: [ID] }, ID)).toBe('absent')
  })
  it('chiusa senza attendees né absentees = absent', () => {
    expect(getClientSlotState({ status: 'completed' }, ID)).toBe('absent')
  })
  it('skipped vince anche se il cliente è in attendees', () => {
    expect(getClientSlotState({ status: 'skipped', attendees: [ID] }, ID)).toBe('skipped')
  })
  it('planned futuro e planned passato non chiuso restano planned', () => {
    expect(getClientSlotState({ status: 'planned', date: '2099-01-01' }, ID)).toBe('planned')
    expect(getClientSlotState({ status: 'planned', date: '2020-01-01', attendees: [] }, ID)).toBe('planned')
  })
})

describe('calcClientMonthSummary', () => {
  it('nessuna sessione chiusa: 0 / 0, 0 %', () => {
    expect(calcClientMonthSummary([], ID)).toEqual({ present: 0, absent: 0, pct: 0 })
    expect(calcClientMonthSummary([{ status: 'planned' }], ID)).toEqual({ present: 0, absent: 0, pct: 0 })
  })
  it('esclude saltate e pianificate dal denominatore', () => {
    const slots = [
      { status: 'completed', attendees: [ID] },
      { status: 'completed', attendees: [ID] },
      { status: 'completed', attendees: [], absentees: [ID] },
      { status: 'skipped' },
      { status: 'planned' },
    ]
    expect(calcClientMonthSummary(slots, ID)).toEqual({ present: 2, absent: 1, pct: 67 })
  })
  it('arrotonda la percentuale (7 su 8 = 88)', () => {
    const slots = [
      ...Array.from({ length: 7 }, () => ({ status: 'completed', attendees: [ID] })),
      { status: 'completed', absentees: [ID] },
    ]
    expect(calcClientMonthSummary(slots, ID).pct).toBe(88)
  })
})

describe('calcStreakMultiplier / calcSessionXP', () => {
  it('moltiplicatore con tetto a x2', () => {
    expect(calcStreakMultiplier(0)).toBe(1)
    expect(calcStreakMultiplier(4)).toBeCloseTo(1.4)
    expect(calcStreakMultiplier(15)).toBe(2)
  })
  it('calcSessionXP invariato', () => {
    expect(calcSessionXP(50, 0)).toBe(50)
    expect(calcSessionXP(50, 4)).toBe(70)
    expect(calcSessionXP(50, 15)).toBe(100)
  })
})

describe('formatUpcomingDate', () => {
  it('data locale, giorno e mese abbreviati maiuscoli', () => {
    expect(formatUpcomingDate('2026-11-04')).toBe('MER 4 NOV')
    expect(formatUpcomingDate('2026-01-01')).toBe('GIO 1 GEN')
  })
})
