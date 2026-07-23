import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiungiSlot = onCall({ region: REGION }, async (request) => {
  const { orgId, date, startTime, endTime, clientIds = [], groupIds = [] } = request.data

  if (!orgId || !date || !startTime || !endTime) {
    throw new HttpsError('invalid-argument', 'orgId, date, startTime e endTime sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()

  // Cerca slot esistente con stessa date+startTime
  const existingQ = await db.collection(`organizations/${orgId}/slots`)
    .where('date', '==', date)
    .where('startTime', '==', startTime)
    .limit(1)
    .get()

  if (!existingQ.empty) {
    const existingDoc  = existingQ.docs[0]
    const existing     = existingDoc.data()
    const newClientIds = (clientIds).filter(id => !(existing.clientIds ?? []).includes(id))
    const newGroupIds  = (groupIds).filter(id => !(existing.groupIds ?? []).includes(id))

    if (newClientIds.length === 0 && newGroupIds.length === 0) {
      return { id: existingDoc.id, ...existing }
    }

    const updates = {}
    if (newClientIds.length > 0) updates.clientIds = FieldValue.arrayUnion(...newClientIds)
    if (newGroupIds.length > 0)  updates.groupIds  = FieldValue.arrayUnion(...newGroupIds)

    await existingDoc.ref.update(updates)

    return {
      id:           existingDoc.id,
      ...existing,
      clientIds:    [...(existing.clientIds ?? []), ...newClientIds],
      groupIds:     [...(existing.groupIds  ?? []), ...newGroupIds],
    }
  }

  // Crea nuovo slot
  const createdAt = new Date().toISOString()
  const newSlotRef = db.collection(`organizations/${orgId}/slots`).doc()

  await newSlotRef.set({
    date, startTime, endTime,
    clientIds,
    groupIds,
    status:       'planned',
    attendees:    [],
    absentees:    [],
    recurrenceId: null,
    createdAt,
  })

  return {
    id: newSlotRef.id,
    date, startTime, endTime,
    clientIds,
    groupIds,
    status:       'planned',
    attendees:    [],
    absentees:    [],
    recurrenceId: null,
    createdAt,
  }
})
