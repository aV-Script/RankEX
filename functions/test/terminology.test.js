/**
 * Terminologia del modulo nei testi delle callable (ADR-021): funzioni pure,
 * nessun mock. La parità con TERMINOLOGIES sta in src/__tests__/parity/.
 */
import { describe, it, expect } from 'vitest'
import {
  resolveSessionTerm, formatSlotDateIt, sessionCompletedMessage, sessionAbsenceMessage,
} from '../src/shared/terminology.js'

describe('formatSlotDateIt', () => {
  it.each([
    ['2026-11-10', '10 nov'],
    ['2026-01-01', '1 gen'],
    ['2026-03-29', '29 mar'],   // cambio ora legale
    ['2026-10-25', '25 ott'],   // cambio ora legale
    ['2026-12-31', '31 dic'],
  ])('%s → %s', (iso, expected) => {
    expect(formatSlotDateIt(iso)).toBe(expected)
  })

  it('input non valido o assente: restituito invariato, nessun throw', () => {
    expect(formatSlotDateIt(undefined)).toBe('')
    expect(formatSlotDateIt('')).toBe('')
    expect(formatSlotDateIt('10/11/2026')).toBe('10/11/2026')
  })
})

describe('resolveSessionTerm', () => {
  it('modulo assente o sconosciuto: PT', () => {
    expect(resolveSessionTerm(null)).toEqual({ session: 'Sessione', sessionGender: 'f' })
    expect(resolveSessionTerm(undefined)).toEqual({ session: 'Sessione', sessionGender: 'f' })
    expect(resolveSessionTerm('xyz')).toEqual({ session: 'Sessione', sessionGender: 'f' })
  })

  it('la variante nota vince sul modulo', () => {
    expect(resolveSessionTerm('personal_training', 'gym').session).toBe('Allenamento')
    expect(resolveSessionTerm('soccer_academy').session).toBe('Allenamento')
    expect(resolveSessionTerm('lipedema').session).toBe('Appuntamento')
  })
})

describe('messaggi', () => {
  const soccer = resolveSessionTerm('soccer_academy')
  const pt     = resolveSessionTerm('personal_training')

  it('presenza: genere del termine e coda invariata', () => {
    expect(sessionCompletedMessage(pt, '2026-11-10', { xpGain: 55, streak: 1 }))
      .toBe('Sessione del 10 nov completata! +55 XP (streak 1)')
    expect(sessionCompletedMessage(soccer, '2026-11-10', { xpGain: 55, streak: 1, planTitle: 'Forza' }))
      .toBe('Allenamento del 10 nov completato e scheda "Forza" finita! +55 XP (streak 1)')
  })

  it('assenza', () => {
    expect(sessionAbsenceMessage(soccer, '2026-11-10')).toBe('Allenamento del 10 nov — assenza registrata. Streak azzerata.')
  })
})
