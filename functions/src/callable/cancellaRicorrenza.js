import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const cancellaRicorrenza = onCall({ region: REGION }, async (request) => {
  const { orgId, recurrenceId } = request.data

  if (!orgId || !recurrenceId) {
    throw new HttpsError('invalid-argument', 'orgId e recurrenceId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db    = getFirestore()
  const today = new Date().toISOString().slice(0, 10)

  const slotsSnap = await db.collection(`organizations/${orgId}/slots`)
    .where('recurrenceId', '==', recurrenceId)
    .where('date', '>=', today)
    .get()

  const batch = db.batch()
  batch.update(db.doc(`organizations/${orgId}/recurrences/${recurrenceId}`), { status: 'cancelled' })
  slotsSnap.docs.forEach(slotDoc => {
    batch.delete(slotDoc.ref)
  })

  await batch.commit()

  return { ok: true }
})
