import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }       from 'firebase-admin/firestore'
import { requireOrgAccess }   from '../shared/auth.js'

const REGION = 'europe-west1'

export const annullaObiettivo = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, goalId } = request.data

  if (!orgId || !clientId || !goalId) {
    throw new HttpsError('invalid-argument', 'orgId, clientId e goalId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db      = getFirestore()
  const goalRef = db.doc(`organizations/${orgId}/clients/${clientId}/goals/${goalId}`)
  const snap    = await goalRef.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Obiettivo non trovato')
  if (snap.data().status !== 'active') {
    throw new HttpsError('failed-precondition', 'Solo un obiettivo attivo può essere annullato')
  }

  await goalRef.update({ status: 'cancelled' })

  return { ok: true }
})
