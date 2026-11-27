/**
 * Testi dei trofei con la terminologia del modulo (BUG-038): label e descrizione
 * si risolvono a render con getBadgeLabel / getBadgeDescription.
 */
import { describe, it, expect } from 'vitest'
import { BADGES, getBadgeLabel, getBadgeDescription } from '../../config/badges.config.js'
import { getTerminology } from '../../config/modules.config.js'

const PT     = getTerminology('personal_training')
const GYM    = getTerminology('personal_training', 'gym')
const SOCCER = getTerminology('soccer_academy')

const texts = terminology => BADGES.flatMap(badge => [getBadgeLabel(badge, terminology), getBadgeDescription(badge, terminology)])
const byId  = id => BADGES.find(badge => badge.id === id)

describe('testi dei trofei per modulo', () => {
  it('soccer: nessun "sessione/sessioni" e nessun "trainer"', () => {
    for (const text of texts(SOCCER)) {
      expect(text).not.toMatch(/sessione|sessioni|trainer/i)
    }
  })

  it('GYM: nessun "sessione/sessioni"', () => {
    for (const text of texts(GYM)) {
      expect(text).not.toMatch(/sessione|sessioni/i)
    }
  })

  it('ogni testo è una stringa non vuota e senza segnaposto', () => {
    for (const terminology of [PT, GYM, SOCCER]) {
      for (const text of texts(terminology)) {
        expect(typeof text).toBe('string')
        expect(text.length).toBeGreaterThan(0)
        expect(text).not.toMatch(/undefined|\$\{/)
      }
    }
  })

  it('soccer: termine e concordanza di genere', () => {
    expect(getBadgeLabel(byId('prima_sessione'), SOCCER)).toBe('Primo Allenamento')
    expect(getBadgeDescription(byId('prima_sessione'), SOCCER)).toBe('Hai completato il tuo primo allenamento.')
    expect(getBadgeDescription(byId('striscia_5'), SOCCER)).toBe('Hai completato 5 allenamenti.')
    expect(getBadgeDescription(byId('campione'), SOCCER)).toBe('Riconoscimento speciale del coach.')
    expect(getBadgeDescription(byId('mvp'), SOCCER)).toBe("Most Valuable Player — il migliore dell'allenamento.")
  })

  it('PT: resta la terminologia "sessione" al femminile', () => {
    expect(getBadgeLabel(byId('prima_sessione'), PT)).toBe('Prima Sessione')
    expect(getBadgeDescription(byId('prima_sessione'), PT)).toBe('Hai completato la tua prima sessione.')
    expect(getBadgeDescription(byId('striscia_10'), PT)).toBe('Hai completato 10 sessioni.')
    expect(getBadgeDescription(byId('campione'), PT)).toBe('Riconoscimento speciale del trainer.')
    expect(getBadgeDescription(byId('mvp'), PT)).toBe('Most Valuable Player — il migliore della sessione.')
  })

  it('terminologia assente (area cliente senza provider): ripiega su PT', () => {
    expect(getBadgeLabel(byId('prima_sessione'), undefined)).toBe('Prima Sessione')
    expect(getBadgeDescription(byId('striscia_5'), null)).toBe('Hai completato 5 sessioni.')
  })

  it('i testi senza termini di modulo restano uguali per ogni modulo', () => {
    expect(getBadgeDescription(byId('top_performer'), SOCCER)).toBe(getBadgeDescription(byId('top_performer'), PT))
  })
})
