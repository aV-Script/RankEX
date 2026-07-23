import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiornaSlot = onCall({ region: REGION }, async (request) => {
  const { orgId, slotId, data } = request.data

  if (!orgId || !slotId || !data) {
    throw new HttpsError('invalid-argument', 'orgId, slotId e data sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/slots/${slotId}`).update(data)

  return { ok: true }
})
