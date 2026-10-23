import { onCall, HttpsError }       from 'firebase-functions/v2/https'
import { getFirestore }             from 'firebase-admin/firestore'
import { requireOrgMemberOrClient } from '../shared/auth.js'

const REGION = 'europe-west1'

export const segnaNotificaLetta = onCall({ region: REGION }, async (request) => {
  const { orgId, notificationId } = request.data

  if (!orgId || !notificationId) {
    throw new HttpsError('invalid-argument', 'orgId e notificationId sono obbligatori')
  }

  const profile = await requireOrgMemberOrClient(request, orgId)
  if (profile.role === 'staff_readonly') {
    throw new HttpsError('permission-denied', 'Permessi insufficienti')
  }

  const db     = getFirestore()
  const notRef = db.doc(`organizations/${orgId}/notifications/${notificationId}`)
  const notDoc = await notRef.get()
  if (!notDoc.exists) throw new HttpsError('not-found', 'Notifica non trovata')
  // Un cliente segna letta solo una propria notifica
  if (profile.role === 'client' && notDoc.data().clientId !== profile.clientId) {
    throw new HttpsError('permission-denied', 'Puoi gestire solo le tue notifiche')
  }

  await notRef.update({
    read:   true,
    readAt: new Date().toISOString(),
  })

  return { ok: true }
})
