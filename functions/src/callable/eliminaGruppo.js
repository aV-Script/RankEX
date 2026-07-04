import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const eliminaGruppo = onCall({ region: REGION }, async (request) => {
  const { orgId, groupId } = request.data

  if (!orgId || !groupId) {
    throw new HttpsError('invalid-argument', 'orgId e groupId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/groups/${groupId}`).delete()

  return { ok: true }
})
