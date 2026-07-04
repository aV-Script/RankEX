import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }          from 'firebase-admin/auth'
import { requireOrgAccess } from '../shared/auth.js'
import { buildNewClient }   from '../shared/gamification.js'

const REGION = 'europe-west1'

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
}

export const creaCliente = onCall({ region: REGION }, async (request) => {
  const { orgId, trainerId, formData } = request.data
  await requireOrgAccess(request, orgId)

  if (!formData?.email || !formData?.password) {
    throw new HttpsError('invalid-argument', 'email e password sono obbligatori')
  }

  const { email, password, testValues = {}, stats = {}, ...anagrafica } = formData

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

  const db = getFirestore()
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
