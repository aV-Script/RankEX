import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const eliminaSchedaAllenamento = onCall({ region: REGION }, async (request) => {
  const { orgId, planId } = request.data

  if (!orgId || !planId) {
    throw new HttpsError('invalid-argument', 'orgId e planId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/workoutPlans/${planId}`).delete()

  return { ok: true }
})
