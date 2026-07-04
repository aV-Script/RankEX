import { onCall, HttpsError }       from 'firebase-functions/v2/https'
import { getFirestore }             from 'firebase-admin/firestore'
import { requireOrgMemberOrClient } from '../shared/auth.js'

const REGION = 'europe-west1'

export const segnaNotificaLetta = onCall({ region: REGION }, async (request) => {
  const { orgId, notificationId } = request.data

  if (!orgId || !notificationId) {
    throw new HttpsError('invalid-argument', 'orgId e notificationId sono obbligatori')
  }

  await requireOrgMemberOrClient(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/notifications/${notificationId}`).update({
    read:   true,
    readAt: new Date().toISOString(),
  })

  return { ok: true }
})
