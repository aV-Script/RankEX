import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }          from 'firebase-admin/auth'
import { requireOrgAccess } from '../shared/auth.js'
import { buildNewClient }   from '../shared/gamification.js'
import {
  pickAllowed, optionalString, optionalEmail, requireValidPassword, requireDate, requireNumber,
} from '../shared/validate.js'
import { isAtClientLimit }  from '../shared/plans.js'
import { getOrgCapabilities } from '../shared/orgModule.js'
import { calcAge }          from '../shared/percentile.js'
import { buildPrivacyNotice, writeAudit, AUDIT_PRIVACY_NOTICE_RECORDED } from '../shared/actor.js'

const REGION = 'europe-west1'

const ANAGRAFICA_FIELDS = [
  'name', 'dataNascita', 'eta', 'sesso', 'peso', 'altezza',
  'categoria', 'ruolo', 'profileType',
]

// Moduli senza login del cliente (lipedema, ADR-010): l'email è solo un recapito e
// viene validata a parte (optionalEmail). Niente categoria/ruolo/profileType dal
// client: sono fissati in CLIENT_WITHOUT_LOGIN_DEFAULTS.
const ANAGRAFICA_FIELDS_WITHOUT_LOGIN = [
  'name', 'dataNascita', 'eta', 'sesso', 'peso', 'altezza',
]

// profileType 'complete' fisso: riusa il gating BIA esistente (getProfileCategory)
// senza esporre la scelta del profilo; l'upgrade è comunque rifiutato (ADR-008).
// Nessun campo di gamification (xp/level/rank/stats/log/coins/badges...): un campo
// assente non può essere mostrato per errore (ADR-010, STORY-031).
const CLIENT_WITHOUT_LOGIN_DEFAULTS = {
  categoria:     null,
  profileType:   'complete',
  misureHistory: [],
  biaHistory:    [],
  lastBia:       null,
  clientAuthUid: null,
}

// Stessi limiti del wizard (src/utils/validation.js → validateBirthDate/validateNumber
// in useWizard.validateAnagrafica): qui valgono anche per chi chiama la callable
// direttamente.
const NAME_MAX_LENGTH = 100
const SEX_VALUES      = ['M', 'F']
const AGE_RANGE       = { min: 3,  max: 100 }
const WEIGHT_KG_RANGE = { min: 20, max: 300 }
const HEIGHT_CM_RANGE = { min: 50, max: 250 }

const NEW_CLIENT_DEFAULTS = {
  level:              1,
  rank:               'F',
  rankColor:          '#6b7280',
  xp:                 0,
  xpNext:             500,
  stats:              {},
  log:                [],
  campionamenti:      [],
  sessionStreak:      0,
  lastSessionDate:    null,
  baseXP:             50,
  maxMonthlySessions: 20,
  sessionsPerWeek:    3,
  profileType:        'tests_only',
  biaHistory:         [],
  lastBia:            null,
  coins:              0,   // valuta negozio avatar — spike EPIC-005, vedi ADR-002
  avatarPurchased:    [],
}

export const creaCliente = onCall({ region: REGION }, async (request) => {
  const { orgId, trainerId, formData } = request.data
  const profile = await requireOrgAccess(request, orgId)

  const db = getFirestore()
  // Account sì/no deciso dal modulo dell'org letto qui, mai da un flag del client
  // (ADR-008/010).
  const capabilities = await getOrgCapabilities(db, orgId)

  if (capabilities.hasClientLogin && (!formData?.email || !formData?.password)) {
    throw new HttpsError('invalid-argument', 'email e password sono obbligatori')
  }

  // Limite piano applicato qui perché le Firestore rules (withinClientLimit) non
  // proteggono le Cloud Functions: l'Admin SDK le bypassa sempre. super_admin bypassa
  // il limite come in tutte le altre superfici (rules, UI) — vedi CLAUDE.md "Piani SaaS".
  const orgSnap = await db.doc(`organizations/${orgId}`).get()
  if (!orgSnap.exists) throw new HttpsError('not-found', 'Organizzazione non trovata')
  const orgData = orgSnap.data()

  if (profile.role !== 'super_admin' && isAtClientLimit(orgData.plan, orgData.clientCount)) {
    throw new HttpsError('resource-exhausted', `Limite clienti del piano ${orgData.plan ?? 'free'} raggiunto`)
  }

  if (!capabilities.hasClientLogin) {
    return createClientWithoutLogin(db, request, { orgId, trainerId, formData, profile, capabilities })
  }

  const { email, password, testValues = {}, stats = {}, ...rest } = formData
  requireValidPassword(password)
  // Solo i campi raccolti dal wizard (useWizard → handleConfirmSubmit). Lo spread
  // completo permetteva di creare un cliente con coins, badges, xp o
  // avatarPurchased già impostati, che finivano sopra ai default.
  const anagrafica = pickAllowed(rest, ANAGRAFICA_FIELDS)
  optionalString(anagrafica.name, 'name', 100)

  // Crea l'account Firebase Auth con Admin SDK — nessun logout del trainer
  let clientUid
  try {
    const userRecord = await getAuth().createUser({ email, password })
    clientUid = userRecord.uid
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email già in uso')
    }
    throw new HttpsError('internal', `Errore creazione account: ${err.message}`)
  }

  const data = buildNewClient(trainerId, { ...anagrafica, testValues, stats }, NEW_CLIENT_DEFAULTS)

  const clientRef = db.collection(`organizations/${orgId}/clients`).doc()
  const clientId  = clientRef.id

  try {
    const batch = db.batch()

    batch.set(clientRef, {
      ...data,
      email,
      clientAuthUid: clientUid,
      createdAt: new Date().toISOString(),
    })

    batch.set(db.doc(`users/${clientUid}`), {
      role:               'client',
      orgId,
      clientId,
      trainerId,
      mustChangePassword: true,
    })

    batch.update(db.doc(`organizations/${orgId}`), {
      clientCount: FieldValue.increment(1),
    })

    await batch.commit()
  } catch (err) {
    // Rollback: elimina l'utente Auth creato
    try { await getAuth().deleteUser(clientUid) } catch {}
    throw new HttpsError('internal', `Errore salvataggio Firestore: ${err.message}`)
  }

  // Audit log — fire and forget
  db.collection('audit_logs').add({
    action:    'CLIENT_CREATED',
    uid:       request.auth?.uid ?? null,
    email:     request.auth?.token?.email ?? null,
    timestamp: new Date().toISOString(),
    details:   { clientId, clientName: data.name, orgId },
    env:       'functions',
  }).catch(() => {})

  return { id: clientId, ...data, email, clientAuthUid: clientUid }
})


/**
 * Cliente senza account Firebase Auth né /users/{uid} (ADR-010): il paziente non
 * accede all'app, quindi nessuna password (rifiutata se arriva) ed email facoltativa.
 * clientCount nello stesso batch del doc, come per gli altri moduli.
 */
async function createClientWithoutLogin(db, request, { orgId, trainerId, formData, profile, capabilities }) {
  const anagrafica = validateAnagraficaWithoutLogin(formData)

  if (formData.password !== undefined && formData.password !== null && formData.password !== '') {
    throw new HttpsError('invalid-argument', "Il modulo dell'organizzazione non prevede un account di accesso per il cliente")
  }
  const email = optionalEmail(formData.email)

  // Attestazione "informativa consegnata" raccolta dal wizard (ADR-015 §1),
  // facoltativa: senza, il paziente si crea lo stesso e valutazioni/BIA restano
  // bloccate finché non si registra con registraInformativaPaziente
  const privacyNotice = readPrivacyNotice(formData.privacyNotice, anagrafica, { request, profile, capabilities })

  const data = {
    ...anagrafica,
    ...CLIENT_WITHOUT_LOGIN_DEFAULTS,
    email,
    trainerId,
    ...(privacyNotice ? { privacyNotice } : {}),
  }

  const clientRef = db.collection(`organizations/${orgId}/clients`).doc()
  const clientId  = clientRef.id

  try {
    const batch = db.batch()
    batch.set(clientRef, { ...data, createdAt: new Date().toISOString() })
    batch.update(db.doc(`organizations/${orgId}`), {
      clientCount: FieldValue.increment(1),
    })
    await batch.commit()
  } catch (err) {
    throw new HttpsError('internal', `Errore salvataggio Firestore: ${err.message}`)
  }

  // Solo identificativi: nome + org = diagnosi in un log letto da super_admin
  // (ADR-015 §2).
  db.collection('audit_logs').add({
    action:    'CLIENT_CREATED',
    uid:       request.auth?.uid ?? null,
    email:     request.auth?.token?.email ?? null,
    timestamp: new Date().toISOString(),
    details:   { clientId, orgId },
    env:       'functions',
  }).catch(() => {})

  if (privacyNotice) {
    writeAudit(db, request, AUDIT_PRIVACY_NOTICE_RECORDED, {
      orgId, clientId, informativaVersion: privacyNotice.informativaVersion,
    })
  }

  return { id: clientId, ...data }
}

/**
 * Informativa consegnata, se il wizard l'ha raccolta: stesso helper di
 * registraInformativaPaziente (shared/actor.js). Solo nei moduli con
 * valutazioni; recordedBy/recordedAt li imposta il server.
 * @returns {object|null}
 */
function readPrivacyNotice(input, anagrafica, { request, profile, capabilities }) {
  if (input === undefined || input === null) return null
  if (!capabilities.hasAssessments) {
    throw new HttpsError('invalid-argument', "Il modulo dell'organizzazione non prevede l'informativa paziente")
  }
  return buildPrivacyNotice(input, anagrafica.dataNascita, { profile, request })
}

/**
 * Anagrafica del paziente validata lato server (l'Admin SDK non passa dalle rules).
 * Nome obbligatorio; data di nascita, sesso, peso e altezza facoltativi (null) ma, se
 * presenti, nel formato e negli intervalli del wizard. `eta` è derivata dalla data di
 * nascita quando c'è, così non può contraddirla.
 */
function validateAnagraficaWithoutLogin(formData) {
  const fields = pickAllowed(formData, ANAGRAFICA_FIELDS_WITHOUT_LOGIN)

  const name = optionalString(fields.name, 'name', NAME_MAX_LENGTH).trim()
  if (!name) throw new HttpsError('invalid-argument', 'name obbligatorio')

  const sesso = fields.sesso ?? null
  if (sesso !== null && !SEX_VALUES.includes(sesso)) {
    throw new HttpsError('invalid-argument', `sesso deve essere uno tra ${SEX_VALUES.join(', ')}`)
  }

  const dataNascita = isBlank(fields.dataNascita) ? null : requireDate(fields.dataNascita, 'dataNascita')
  const eta = dataNascita
    ? requireNumber(calcAge(dataNascita), 'età dalla data di nascita', { ...AGE_RANGE, integer: true })
    : optionalNumber(fields.eta, 'eta', { ...AGE_RANGE, integer: true })

  return {
    name,
    dataNascita,
    eta,
    sesso,
    peso:    optionalNumber(fields.peso,    'peso',    WEIGHT_KG_RANGE),
    altezza: optionalNumber(fields.altezza, 'altezza', HEIGHT_CM_RANGE),
  }
}

function optionalNumber(value, name, range) {
  return isBlank(value) ? null : requireNumber(value, name, range)
}

function isBlank(value) {
  return value === undefined || value === null || value === ''
}
