import { describe, it, expect } from 'vitest'
import { getModule, getTerminology, MODULES } from '../../config/modules.config.js'
import { getDeletedItems, isDeleteNameConfirmed } from '../../features/client/client-dashboard/deleteDialogModel.js'

const tail = sessions => ['Scheda allenamento (tutte)', 'Notifiche', `Rimozione da ${sessions}, ricorrenze e gruppi`]

describe('getDeletedItems', () => {
  it('PT: account, campionamenti, BIA, note, obiettivi', () => {
    expect(getDeletedItems(getModule(MODULES.PERSONAL_TRAINING), getTerminology(MODULES.PERSONAL_TRAINING))).toEqual([
      'Account di accesso', 'Campionamenti e statistiche', 'Misurazioni BIA', 'Note e commenti', 'Obiettivi', ...tail('sessioni'),
    ])
  })

  it('Soccer: niente BIA e niente valutazioni', () => {
    expect(getDeletedItems(getModule(MODULES.SOCCER_ACADEMY), getTerminology(MODULES.SOCCER_ACADEMY))).toEqual([
      'Account di accesso', 'Campionamenti e statistiche', 'Note e commenti', 'Obiettivi', ...tail('allenamenti'),
    ])
  })

  it('Lipedema: valutazioni, BIA, note; niente account né obiettivi', () => {
    expect(getDeletedItems(getModule(MODULES.LIPEDEMA), getTerminology(MODULES.LIPEDEMA))).toEqual([
      'Valutazioni', 'Misurazioni BIA', 'Note e commenti',
      'Piano esercizi (tutti)', 'Notifiche', 'Rimozione da appuntamenti, ricorrenze e gruppi',
    ])
  })

  it('modulo sconosciuto o capability assenti: solo le note', () => {
    expect(getDeletedItems(getModule('altro'))).toContain('Note e commenti')
    expect(getDeletedItems(undefined)).toEqual(['Note e commenti', ...tail('allenamenti')])
  })
})

describe('isDeleteNameConfirmed', () => {
  it('ignora spazi esterni e maiuscole', () => {
    expect(isDeleteNameConfirmed('  mario ROSSI ', 'Mario Rossi')).toBe(true)
  })

  it('rifiuta nomi diversi o parziali', () => {
    expect(isDeleteNameConfirmed('Mario', 'Mario Rossi')).toBe(false)
    expect(isDeleteNameConfirmed('', 'Mario Rossi')).toBe(false)
  })

  it('non conferma mai se il nome del cliente è vuoto', () => {
    expect(isDeleteNameConfirmed('', '')).toBe(false)
    expect(isDeleteNameConfirmed('x', undefined)).toBe(false)
  })
})
