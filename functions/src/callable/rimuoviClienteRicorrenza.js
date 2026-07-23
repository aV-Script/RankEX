import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const rimuoviClienteRicorrenza = onCall({ region: REGION }, async (request) => {
  const { orgId, recurrenceId, clientId } = request.data

  if (!orgId || !recurrenceId || !clientId) {
    throw new HttpsError('invalid-argument', 'orgId, recurrenceId e clientId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db    = getFirestore()
  const today = new Date().toISOString().slice(0, 10)

  const slotsSnap = await db.collection(`organizations/${orgId}/slots`)
    .where('recurrenceId', '==', recurrenceId)
    .where('date', '>=', today)
    .get()

  const batch = db.batch()
  batch.update(db.doc(`organizations/${orgId}/recurrences/${recurrenceId}`), {
    clientIds: FieldValue.arrayRemove(clientId),
  })
  slotsSnap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, { clientIds: FieldValue.arrayRemove(clientId) })
  })

  await batch.commit()

  return { ok: true }
})
