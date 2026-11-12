import { describe, it, expect } from 'vitest'
import { e2eSlotDate, isSlotInPreviousAppWeek, romeDateStr } from '../../../e2e/qa-dev/slotFixtureDate.js'

/** Come lo spec: data di ieri a Roma e verifica sulla settimana dell'app, a partire da un istante UTC. */
function needsPreviousWeek(nowIso) {
  const now = new Date(nowIso)
  return isSlotInPreviousAppWeek(e2eSlotDate(now), romeDateStr(now))
}

describe('romeDateStr', () => {
  it('usa la data di Roma, non quella UTC', () => {
    expect(romeDateStr(new Date('2026-11-08T23:30:00Z'))).toBe('2026-11-09')
    expect(romeDateStr(new Date('2026-11-09T12:00:00Z'))).toBe('2026-11-09')
  })
})

describe('e2eSlotDate', () => {
  it('è ieri', () => {
    expect(e2eSlotDate(new Date('2026-11-12T10:00:00Z'))).toBe('2026-11-11')
  })

  it('cambio mese e anno', () => {
    expect(e2eSlotDate(new Date('2026-06-01T10:00:00Z'))).toBe('2026-05-31')
    expect(e2eSlotDate(new Date('2026-01-01T10:00:00Z'))).toBe('2025-12-31')
  })

  it('alle 23:30 UTC a Roma è già il giorno dopo: ieri è la data UTC', () => {
    expect(e2eSlotDate(new Date('2026-11-11T23:30:00Z'))).toBe('2026-11-11')
  })
})

describe('isSlotInPreviousAppWeek', () => {
  it('lunedì: ieri è la domenica della settimana precedente', () => {
    expect(needsPreviousWeek('2026-11-09T10:00:00Z')).toBe(true)
  })

  it('martedì e domenica: ieri è nella settimana corrente', () => {
    expect(needsPreviousWeek('2026-11-10T10:00:00Z')).toBe(false)
    expect(needsPreviousWeek('2026-11-15T10:00:00Z')).toBe(false)
  })

  it('lunedì 1 del mese e 1 gennaio di lunedì', () => {
    expect(needsPreviousWeek('2026-06-01T10:00:00Z')).toBe(true)
    expect(needsPreviousWeek('2024-01-01T10:00:00Z')).toBe(true)
  })

  it('1 gennaio non di lunedì: ieri è il 31 dicembre della stessa settimana', () => {
    expect(needsPreviousWeek('2026-01-01T10:00:00Z')).toBe(false)
  })

  it('ora legale di marzo (domenica 29 -> lunedì 30)', () => {
    expect(needsPreviousWeek('2026-03-29T21:30:00Z')).toBe(false) // domenica 23:30 Roma
    expect(needsPreviousWeek('2026-03-29T22:30:00Z')).toBe(true)  // lunedì 00:30 Roma
  })

  it('ora solare di ottobre (domenica 25 -> lunedì 26)', () => {
    expect(needsPreviousWeek('2026-10-25T22:30:00Z')).toBe(false) // domenica 23:30 Roma
    expect(needsPreviousWeek('2026-10-25T23:30:00Z')).toBe(true)  // lunedì 00:30 Roma
  })

  it('23:30 UTC di domenica: a Roma è già lunedì', () => {
    expect(needsPreviousWeek('2026-11-08T23:30:00Z')).toBe(true)
  })

  it('una data più vecchia o futura non è nella settimana precedente', () => {
    expect(isSlotInPreviousAppWeek('2026-11-01', '2026-11-12')).toBe(false)
    expect(isSlotInPreviousAppWeek('2026-11-09', '2026-11-12')).toBe(false)
    expect(isSlotInPreviousAppWeek('2026-11-08', '2026-11-12')).toBe(true)
    expect(isSlotInPreviousAppWeek('2026-11-02', '2026-11-12')).toBe(true)
  })
})
