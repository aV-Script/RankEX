import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiornaSchedaAllenamento = onCall({ region: REGION }, async (request) => {
  const { orgId, planId, data } = request.data

  if (!orgId || !planId || !data) {
    throw new HttpsError('invalid-argument', 'orgId, planId e data sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/workoutPlans/${planId}`).update({
    ...data,
    updatedAt: new Date().toISOString(),
  })

  return { ok: true }
})
