import { onCall, HttpsError }       from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const REGION = 'europe-west1'

// Nessun harness di test per le Cloud Functions esiste oggi in questo repo
// (vedi docs/DECISIONS.md → ADR-004) — verificato con script one-off contro
// rankex-dev, stesso precedente di STORY-014/acquistaAvatar.

// Guardrail anti-spam minimo (ADR-004, opzione b): non ferma un attaccante
// con email casuali/distribuite — rischio residuo accettato esplicitamente,
// da rivalutare solo se si osserva abuso reale (stessa filosofia già
// applicata alla rimozione di App Check, vedi CLAUDE.md → Sicurezza).
const THROTTLE_WINDOW_MINUTES = 5
const THROTTLE_MAX_ENTRIES    = 5

// Controllo minimo di forma email — non serve una regex perfetta (RFC 5322),
// solo un filtro anti-garbage prima di scrivere nel log.
const EMAIL_PATTERN    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX_LENGTH = 254

/**
 * Callable pubblica (nessuna autenticazione richiesta — per definizione, chi
 * la chiama non ha un utente valido nell'istante in cui il login è fallito).
 * Scrive l'entry auth.login_failed via Admin SDK, bypassando firestore.rules
 * (coerente con le altre callable, vedi CLAUDE.md → "Backend — Cloud
 * Functions callable"). Nessuna modifica a firestore.rules necessaria.
 *
 * Sostituisce la chiamata a auditLog(AUDIT_ACTIONS.LOGIN_FAILED, ...) in
 * useLoginForm.js, che non scriveva mai nulla (auditLog abortisce se
 * getAuth().currentUser è null — sempre vero subito dopo un login fallito).
 * Vedi docs/DECISIONS.md → ADR-004.
 */
export const registraLoginFallito = onCall({ region: REGION }, async (request) => {
  const rawEmail = request.data?.email

  if (typeof rawEmail !== 'string') {
    throw new HttpsError('invalid-argument', 'email è obbligatoria')
  }

  const email = rawEmail.trim().toLowerCase()

  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new HttpsError('invalid-argument', 'Formato email non valido')
  }

  const db = getFirestore()

  // orderBy + limit(THROTTLE_MAX_ENTRIES): senza questo bound, un attaccante
  // che colpisce la stessa email a intervalli regolari (sempre sotto soglia,
  // es. ogni 6 minuti) fa scaricare l'INTERO storico di quell'email ad ogni
  // chiamata per calcolare recentCount — costo di lettura illimitato su un
  // endpoint pubblico non autenticato, lo stesso rischio per cui ADR-004 ha
  // scartato l'opzione (a) lato scrittura (code review STORY-017). Richiede
  // l'indice composito (action, email, timestamp DESC) in firestore.index.json.
  const recentSnap = await db.collection('audit_logs')
    .where('action', '==', 'auth.login_failed')
    .where('email', '==', email)
    .orderBy('timestamp', 'desc')
    .limit(THROTTLE_MAX_ENTRIES)
    .get()

  const cutoffMs = Date.now() - THROTTLE_WINDOW_MINUTES * 60 * 1000
  const recentCount = recentSnap.docs.filter(entry => {
    const ts = entry.data().timestamp
    return ts && ts.toMillis() >= cutoffMs
  }).length

  // Throttle superato: non scrive una nuova entry, ma risponde comunque
  // "ok" — nessuna differenza osservabile lato client, per non rivelare
  // nulla sull'esistenza dell'email né sul throttling stesso.
  if (recentCount >= THROTTLE_MAX_ENTRIES) {
    return { ok: true }
  }

  await db.collection('audit_logs').add({
    action:    'auth.login_failed', // hardcoded server-side, mai dal client
    uid:       null,                // nessun utente autenticato al momento del fallimento
    email,
    timestamp: FieldValue.serverTimestamp(),
    details:   {},
    env:       'functions',
  })

  return { ok: true }
})
