/**
 * Messaggi d'errore — prima i codici delle Cloud Functions (functions/*) non
 * erano gestiti: l'utente leggeva "internal", e l'email già in uso in creazione
 * cliente/membro non veniva più segnalata sul campo email.
 */
import { describe, it, expect } from 'vitest'
import { getFirebaseErrorMessage, isEmailTakenError } from '../../utils/firebaseErrors.js'

describe('getFirebaseErrorMessage', () => {
  it('mostra il messaggio italiano scritto dalla callable', () => {
    const err = { code: 'functions/resource-exhausted', message: 'Limite clienti del piano free raggiunto' }
    expect(getFirebaseErrorMessage(err, 'fallback')).toBe('Limite clienti del piano free raggiunto')
  })

  it('usa il fallback per functions/internal invece di "internal"', () => {
    expect(getFirebaseErrorMessage({ code: 'functions/internal', message: 'internal' }, 'Impossibile salvare'))
      .toBe('Impossibile salvare')
  })

  it('traduce i codici di rete delle callable', () => {
    expect(getFirebaseErrorMessage({ code: 'functions/unavailable', message: 'unavailable' }))
      .toBe('Servizio temporaneamente non disponibile. Riprova.')
  })

  it('mantiene la traduzione dei codici Auth', () => {
    expect(getFirebaseErrorMessage({ code: 'auth/email-already-in-use' })).toBe("Email già in uso. Scegli un'altra email.")
  })

  it('senza errore restituisce il fallback', () => {
    expect(getFirebaseErrorMessage(null, 'fallback')).toBe('fallback')
  })
})

describe('isEmailTakenError', () => {
  it('riconosce l\'email già in uso restituita da creaCliente/creaMembroTeam', () => {
    expect(isEmailTakenError({ code: 'functions/already-exists' })).toBe(true)
    expect(isEmailTakenError({ code: 'auth/email-already-in-use' })).toBe(true)
  })
  it('non scambia altri errori per errori sull\'email', () => {
    expect(isEmailTakenError({ code: 'functions/resource-exhausted' })).toBe(false)
    expect(isEmailTakenError(undefined)).toBe(false)
  })
})
