const FIREBASE_ERROR_MESSAGES = {
  // Auth
  'auth/wrong-password':         'Password non corretta',
  'auth/user-not-found':         'Nessun account associato a questa email',
  'auth/invalid-email':          'Formato email non valido',
  'auth/invalid-credential':     'Credenziali non valide',
  'auth/email-already-in-use':   "Email già in uso. Scegli un'altra email.",
  'auth/requires-recent-login':  'Sessione scaduta. Effettua di nuovo il login.',
  'auth/too-many-requests':      'Troppi tentativi. Riprova tra qualche minuto.',
  'auth/user-disabled':          'Account disabilitato.',
  'auth/network-request-failed': 'Errore di rete. Controlla la connessione.',
  // Firestore
  'permission-denied':           'Accesso negato. Permessi insufficienti.',
  'unavailable':                 'Servizio temporaneamente non disponibile. Riprova.',
  'deadline-exceeded':           'Timeout. Connessione troppo lenta.',
  'not-found':                   'Documento non trovato.',
}

/**
 * Traduce un errore Firebase in un messaggio leggibile in italiano.
 * @param {unknown} err      — errore catturato (FirebaseError o qualsiasi altro)
 * @param {string}  fallback — messaggio usato se il codice errore non è mappato
 */
export function getFirebaseErrorMessage(err, fallback = 'Errore imprevisto. Riprova.') {
  if (!err) return fallback
  return FIREBASE_ERROR_MESSAGES[err.code] ?? err.message ?? fallback
}
