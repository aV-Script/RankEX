import { onCall, HttpsError }      from 'firebase-functions/v2/https'
import { getFirestore }            from 'firebase-admin/firestore'
import { requireOrgAccess }        from '../shared/auth.js'
import { generateRecurrenceDates } from '../shared/calendarUtils.js'

const REGION       = 'europe-west1'
const MAX_PER_BATCH = 490

export const aggiungiRicorrenza = onCall({ region: REGION }, async (request) => {
  const { orgId, clientIds = [], groupIds = [], days, startDate, endDate, startTime, endTime } = request.data

  if (!orgId || !days || !startDate || !endDate || !startTime || !endTime) {
    throw new HttpsError('invalid-argument', 'Parametri obbligatori mancanti')
  }

  await requireOrgAccess(request, orgId)

  const db        = getFirestore()
  const recRef    = db.collection(`organizations/${orgId}/recurrences`).doc()
  const recId     = recRef.id
  const createdAt = new Date().toISOString()

  const dates = generateRecurrenceDates(startDate, endDate, days)

  // Suddivide in batch da max MAX_PER_BATCH operazioni
  // Primo batch include la ricorrenza stessa
  const allBatches = []
  let currentBatch  = db.batch()
  let opsInCurrent  = 0

  currentBatch.set(recRef, {
    clientIds, groupIds, days,
    startDate, endDate, startTime, endTime,
    status: 'active',
    createdAt,
  })
  opsInCurrent++

  for (const date of dates) {
    if (opsInCurrent >= MAX_PER_BATCH) {
      allBatches.push(currentBatch)
      currentBatch = db.batch()
      opsInCurrent = 0
    }
    const slotRef = db.collection(`organizations/${orgId}/slots`).doc()
    currentBatch.set(slotRef, {
      date, startTime, endTime,
      clientIds,
      groupIds,
      recurrenceId: recId,
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

  return { id: recId }
})
