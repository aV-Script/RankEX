import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiornaGruppo = onCall({ region: REGION }, async (request) => {
  const { orgId, groupId, data } = request.data

  if (!orgId || !groupId || !data) {
    throw new HttpsError('invalid-argument', 'orgId, groupId e data sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/groups/${groupId}`).update(data)

  return { ok: true }
})
