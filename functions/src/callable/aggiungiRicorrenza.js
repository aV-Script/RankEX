import { onCall, HttpsError }      from 'firebase-functions/v2/https'
import { getFirestore }            from 'firebase-admin/firestore'
import { requireOrgAccess }        from '../shared/auth.js'
import { generateRecurrenceDates, MAX_RECURRENCE_SLOTS } from '../shared/calendarUtils.js'
import { requireDate, requireTime, requireDays } from '../shared/validate.js'

const REGION = 'europe-west1'

export const aggiungiRicorrenza = onCall({ region: REGION }, async (request) => {
  const { orgId, clientIds = [], groupIds = [], days, startDate, endDate, startTime, endTime } = request.data

  if (!orgId || !days || !startDate || !endDate || !startTime || !endTime) {
    throw new HttpsError('invalid-argument', 'Parametri obbligatori mancanti')
  }

  await requireOrgAccess(request, orgId)
  requireDays(days)
  requireDate(startDate, 'startDate')
  requireDate(endDate, 'endDate')
  requireTime(startTime, 'startTime')
  requireTime(endTime, 'endTime')
  if (endDate < startDate) throw new HttpsError('invalid-argument', 'La data di fine è prima di quella di inizio')
  if (endTime <= startTime) throw new HttpsError('invalid-argument', "L'orario di fine deve essere dopo quello di inizio")

  const db        = getFirestore()
  const recRef    = db.collection(`organizations/${orgId}/recurrences`).doc()
  const recId     = recRef.id
  const createdAt = new Date().toISOString()

  const dates = generateRecurrenceDates(startDate, endDate, days)
  if (dates.length === 0) throw new HttpsError('invalid-argument', 'Nessuna sessione nel periodo scelto')
  if (dates.length > MAX_RECURRENCE_SLOTS) {
    throw new HttpsError('failed-precondition',
      `Ricorrenza troppo lunga: ${dates.length} sessioni, massimo ${MAX_RECURRENCE_SLOTS}. Accorcia il periodo e prolungala in seguito.`)
  }

  // Un solo batch (ricorrenza + slot): tutto o niente. Prima, oltre ~490 slot,
  // più batch in sequenza lasciavano ricorrenze parziali se uno falliva.
  const batch = db.batch()
  batch.set(recRef, {
    clientIds, groupIds, days,
    startDate, endDate, startTime, endTime,
    status: 'active',
    createdAt,
  })

  for (const date of dates) {
    batch.set(db.collection(`organizations/${orgId}/slots`).doc(), {
      date, startTime, endTime,
      clientIds,
      groupIds,
      recurrenceId: recId,
      status:       'planned',
      attendees:    [],
      absentees:    [],
      createdAt,
    })
  }

  await batch.commit()
  return { id: recId, slots: dates.length }
})
