import { onCall, HttpsError }       from 'firebase-functions/v2/https'
import { getFirestore }             from 'firebase-admin/firestore'
import { requireOrgMemberOrClient } from '../shared/auth.js'

const REGION = 'europe-west1'

export const segnaAllLette = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId } = request.data

  if (!orgId || !clientId) {
    throw new HttpsError('invalid-argument', 'orgId e clientId sono obbligatori')
  }

  await requireOrgMemberOrClient(request, orgId)

  const db      = getFirestore()
  const readAt  = new Date().toISOString()

  const unreadSnap = await db.collection(`organizations/${orgId}/notifications`)
    .where('clientId', '==', clientId)
    .where('read', '==', false)
    .get()

  if (unreadSnap.empty) return { ok: true, count: 0 }

  const batch = db.batch()
  unreadSnap.docs.forEach(doc => {
    batch.update(doc.ref, { read: true, readAt })
  })
  await batch.commit()

  return { ok: true, count: unreadSnap.size }
})
