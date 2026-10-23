import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'
import { todayInRome } from '../shared/calendarUtils.js'

const REGION = 'europe-west1'

export const aggiornaRicorrenzaOrario = onCall({ region: REGION }, async (request) => {
  const { orgId, recurrenceId, startTime, endTime } = request.data

  if (!orgId || !recurrenceId || !startTime || !endTime) {
    throw new HttpsError('invalid-argument', 'orgId, recurrenceId, startTime e endTime sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db    = getFirestore()
  const today = todayInRome()

  // Slot futuri della ricorrenza
  const slotsSnap = await db.collection(`organizations/${orgId}/slots`)
    .where('recurrenceId', '==', recurrenceId)
    .where('date', '>=', today)
    .get()

  const batch = db.batch()
  batch.update(db.doc(`organizations/${orgId}/recurrences/${recurrenceId}`), { startTime, endTime })
  slotsSnap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, { startTime, endTime })
  })

  await batch.commit()

  return { ok: true }
})
