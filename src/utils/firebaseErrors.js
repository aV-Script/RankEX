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
  // Cloud Functions (httpsCallable): i messaggi di HttpsError sono già scritti in
  // italiano lato server e vengono mostrati così come sono (vedi sotto). Qui
  // solo i codici che non hanno un messaggio utile per l'utente.
  'functions/unavailable':       'Servizio temporaneamente non disponibile. Riprova.',
  'functions/deadline-exceeded': 'Timeout. Connessione troppo lenta.',
  'functions/unauthenticated':   'Sessione scaduta. Effettua di nuovo il login.',
}

// Codici callable il cui messaggio è generico ("internal") o tecnico: si usa il fallback
const FUNCTIONS_OPAQUE_CODES = new Set(['functions/internal', 'functions/unknown'])

/**
 * Traduce un errore Firebase in un messaggio leggibile in italiano.
 * @param {unknown} err      — errore catturato (FirebaseError o qualsiasi altro)
 * @param {string}  fallback — messaggio usato se il codice errore non è mappato
 */
export function getFirebaseErrorMessage(err, fallback = 'Errore imprevisto. Riprova.') {
  if (!err) return fallback
  if (FIREBASE_ERROR_MESSAGES[err.code]) return FIREBASE_ERROR_MESSAGES[err.code]
  // Prima gli errori delle callable non erano mappati e l'utente leggeva "internal"
  if (FUNCTIONS_OPAQUE_CODES.has(err.code)) return fallback
  return err.message || fallback
}

/** Errore di una callable che riguarda l'email (già in uso) — da mostrare sul campo email */
export function isEmailTakenError(err) {
  return ['auth/email-already-in-use', 'auth/invalid-email', 'functions/already-exists'].includes(err?.code)
}

// Codici che, SOLO nel form di login (utente non ancora autenticato),
// rivelerebbero se un'email è registrata su RankEX (STORY-018/EPIC-007) — un
// messaggio distinto per "password sbagliata" vs "nessun account" permette
// l'enumeration. Negli altri flussi che condividono FIREBASE_ERROR_MESSAGES
// (cambio password di un utente già autenticato in ProfilePage/
// AdminProfilePage/ChangePasswordScreen, dove l'identità è già nota) lo stesso
// codice non è un problema di enumeration — per questo il messaggio generico
// si applica solo qui, via una funzione dedicata, non nella mappa condivisa.
const LOGIN_ENUMERATION_CODES = new Set([
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/invalid-credential',
])
const GENERIC_LOGIN_ERROR = 'Credenziali non valide'

/**
 * Come getFirebaseErrorMessage, ma da usare SOLO nel catch del login: unifica
 * i codici che rivelerebbero l'esistenza di un account in un unico messaggio
 * generico. Non usare per cambio password/altri flussi già autenticati —
 * quelli restano su getFirebaseErrorMessage con i messaggi specifici.
 */
export function getLoginErrorMessage(err, fallback = 'Errore di accesso') {
  if (!err) return fallback
  if (LOGIN_ENUMERATION_CODES.has(err.code)) return GENERIC_LOGIN_ERROR
  return FIREBASE_ERROR_MESSAGES[err.code] ?? err.message ?? fallback
}
