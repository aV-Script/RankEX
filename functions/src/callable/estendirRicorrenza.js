import { onCall, HttpsError }      from 'firebase-functions/v2/https'
import { getFirestore }            from 'firebase-admin/firestore'
import { requireOrgAccess }        from '../shared/auth.js'
import { generateRecurrenceDates, MAX_RECURRENCE_SLOTS, todayInRome } from '../shared/calendarUtils.js'
import { requireDate } from '../shared/validate.js'

const REGION = 'europe-west1'

export const estendirRicorrenza = onCall({ region: REGION }, async (request) => {
  const { orgId, recurrenceId, newEndDate } = request.data

  if (!orgId || !recurrenceId || !newEndDate) {
    throw new HttpsError('invalid-argument', 'orgId, recurrenceId e newEndDate sono obbligatori')
  }

  await requireOrgAccess(request, orgId)
  requireDate(newEndDate, 'newEndDate')

  const db    = getFirestore()
  const recDoc = await db.doc(`organizations/${orgId}/recurrences/${recurrenceId}`).get()
  if (!recDoc.exists) throw new HttpsError('not-found', 'Ricorrenza non trovata')

  const rec       = recDoc.data()
  const createdAt = new Date().toISOString()

  // Data di partenza per le nuove date: oldEndDate + 1 giorno
  const nextStart = new Date(rec.endDate + 'T12:00')
  nextStart.setDate(nextStart.getDate() + 1)
  const newStartDate = nextStart.toISOString().slice(0, 10)

  if (newEndDate <= rec.endDate) {
    throw new HttpsError('invalid-argument', 'La nuova data di fine deve essere dopo quella attuale')
  }
  const newDates = generateRecurrenceDates(newStartDate, newEndDate, rec.days)

  // Il tetto vale sulle sessioni future totali: così anche cancellazione e
  // modifiche (che toccano tutti gli slot futuri in un batch) restano atomiche.
  const futureSnap = await db.collection(`organizations/${orgId}/slots`)
    .where('recurrenceId', '==', recurrenceId)
    .where('date', '>=', todayInRome())
    .count().get()
  const totalFuture = futureSnap.data().count + newDates.length
  if (totalFuture > MAX_RECURRENCE_SLOTS) {
    throw new HttpsError('failed-precondition',
      `Estensione troppo lunga: ${totalFuture} sessioni future, massimo ${MAX_RECURRENCE_SLOTS}.`)
  }

  // Un solo batch: nuova data di fine e nuovi slot insieme. Prima la data di
  // fine veniva aggiornata nel primo di più batch: se un batch successivo
  // falliva, un nuovo tentativo saltava le date mai create.
  const batch = db.batch()
  batch.update(recDoc.ref, { endDate: newEndDate })

  for (const date of newDates) {
    batch.set(db.collection(`organizations/${orgId}/slots`).doc(), {
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
  }

  await batch.commit()
  return { ok: true, slots: newDates.length }
})
