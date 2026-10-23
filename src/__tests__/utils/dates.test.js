/**
 * Date locali — prima "oggi" era calcolato con toISOString().slice(0, 10), cioè
 * in UTC: in Italia tra mezzanotte e le 1-2 risultava il giorno prima.
 * I test costruiscono le date con il costruttore locale, quindi valgono in
 * qualsiasi fuso (anche nella CI in UTC).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { toLocalDateStr } from '../../utils/calendarUtils.js'
import { isGoalMissed }   from '../../utils/goals.js'

afterEach(() => { vi.useRealTimers() })

describe('toLocalDateStr', () => {
  it('restituisce la data locale anche subito dopo mezzanotte', () => {
    expect(toLocalDateStr(new Date(2026, 9, 24, 0, 30))).toBe('2026-10-24')
  })

  it('zero-padding di mese e giorno', () => {
    expect(toLocalDateStr(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
  })

  it('senza argomenti usa la data corrente', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 24, 0, 30))
    expect(toLocalDateStr()).toBe('2026-10-24')
  })
})

describe('isGoalMissed — a cavallo della mezzanotte', () => {
  it('un obiettivo con scadenza oggi non è scaduto alle 00:30', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 24, 0, 30))
    expect(isGoalMissed({ status: 'active', deadline: '2026-10-24' })).toBe(false)
  })

  it('è scaduto il giorno dopo la scadenza', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 25, 0, 30))
    expect(isGoalMissed({ status: 'active', deadline: '2026-10-24' })).toBe(true)
  })
})
