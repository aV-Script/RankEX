import { onCall, HttpsError }      from 'firebase-functions/v2/https'
import { getFirestore }            from 'firebase-admin/firestore'
import { requireOrgAccess }        from '../shared/auth.js'
import { generateRecurrenceDates } from '../shared/calendarUtils.js'

const REGION       = 'europe-west1'
const MAX_PER_BATCH = 490

export const estendirRicorrenza = onCall({ region: REGION }, async (request) => {
  const { orgId, recurrenceId, newEndDate } = request.data

  if (!orgId || !recurrenceId || !newEndDate) {
    throw new HttpsError('invalid-argument', 'orgId, recurrenceId e newEndDate sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db    = getFirestore()
  const recDoc = await db.doc(`organizations/${orgId}/recurrences/${recurrenceId}`).get()
  if (!recDoc.exists) throw new HttpsError('not-found', 'Ricorrenza non trovata')

  const rec       = recDoc.data()
  const createdAt = new Date().toISOString()

  // Data di partenza per le nuove date: oldEndDate + 1 giorno
  const nextStart = new Date(rec.endDate + 'T12:00')
  nextStart.setDate(nextStart.getDate() + 1)
  const newStartDate = nextStart.toISOString().slice(0, 10)

  const newDates = generateRecurrenceDates(newStartDate, newEndDate, rec.days)

  const allBatches = []
  let currentBatch  = db.batch()
  let opsInCurrent  = 0

  currentBatch.update(recDoc.ref, { endDate: newEndDate })
  opsInCurrent++

  for (const date of newDates) {
    if (opsInCurrent >= MAX_PER_BATCH) {
      allBatches.push(currentBatch)
      currentBatch = db.batch()
      opsInCurrent = 0
    }
    const slotRef = db.collection(`organizations/${orgId}/slots`).doc()
    currentBatch.set(slotRef, {
      date,
      startTime:    rec.startTime,
      endTime:      rec.endTime,
      clientIds:    rec.clientIds ?? [],
      groupIds:     rec.groupIds  ?? [],
      recurrenceId,
      status:       'planned',
      attendees:    [],
      absentees:    [],
      createdAt,
    })
    opsInCurrent++
  }

  allBatches.push(currentBatch)
  for (const batch of allBatches) {
    await batch.commit()
  }

  return { ok: true }
})
