import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiungiSchedaAllenamento = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, title, description = '', days = [] } = request.data

  if (!orgId || !clientId || !title) {
    throw new HttpsError('invalid-argument', 'orgId, clientId e title sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db  = getFirestore()
  const now = new Date().toISOString()

  // Trova la scheda attiva corrente (se esiste) e archivila
  const activePlansSnap = await db.collection(`organizations/${orgId}/workoutPlans`)
    .where('clientId', '==', clientId)
    .where('status', '==', 'active')
    .get()

  const batch   = db.batch()
  const newRef  = db.collection(`organizations/${orgId}/workoutPlans`).doc()

  activePlansSnap.docs.forEach(planDoc => {
    batch.update(planDoc.ref, { status: 'archived', updatedAt: now })
  })

  batch.set(newRef, {
    title,
    description,
    clientId,
    days,
    status:    'active',
    createdAt: now,
    updatedAt: now,
  })

  await batch.commit()

  return { id: newRef.id }
})
