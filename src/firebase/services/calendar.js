import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, arrayUnion, arrayRemove,
  writeBatch,
} from 'firebase/firestore'
import { db }                                   from './db'
import { slotsPath, recurrencesPath }           from '../paths'
import { SLOT_STATUS }                          from '../../constants/slotStatus'

// ── Slots ─────────────────────────────────────────────────────────────────────

export const getTrainerSlots = async (orgId, from, to) => {
  const q    = query(
    collection(db, slotsPath(orgId)),
    where('date', '>=', from),
    where('date', '<=', to),
    orderBy('date'),
    orderBy('startTime'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClientSlots = async (orgId, clientId, from, to) => {
  const q    = query(
    collection(db, slotsPath(orgId)),
    where('clientIds', 'array-contains', clientId),
    where('date', '>=', from),
    where('date', '<=', to),
    orderBy('date'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getSlotsByGroup = async (orgId, groupId, fromDate) => {
  const q    = query(
    collection(db, slotsPath(orgId)),
    where('groupIds', 'array-contains', groupId),
    where('date', '>=', fromDate),
    orderBy('date'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addSlot = (orgId, data) =>
  addDoc(collection(db, slotsPath(orgId)), {
    ...data,
    status:    SLOT_STATUS.PLANNED,
    attendees: [],
    absentees: [],
    createdAt: new Date().toISOString(),
  })

export const updateSlot = (orgId, id, data) =>
  updateDoc(doc(db, slotsPath(orgId), id), data)

export const deleteSlot = (orgId, id) =>
  deleteDoc(doc(db, slotsPath(orgId), id))

export const closeSlot = (orgId, id, { attendees, absentees }) =>
  updateDoc(doc(db, slotsPath(orgId), id), {
    status: SLOT_STATUS.COMPLETED,
    attendees,
    absentees,
  })

export const skipSlot = (orgId, id) =>
  updateDoc(doc(db, slotsPath(orgId), id), {
    status:    SLOT_STATUS.SKIPPED,
    attendees: [],
    absentees: [],
  })

export const addClientToSlot = (orgId, slotId, clientId) =>
  updateDoc(doc(db, slotsPath(orgId), slotId), {
    clientIds: arrayUnion(clientId),
  })

export const removeClientFromSlot = (orgId, slotId, clientId) =>
  updateDoc(doc(db, slotsPath(orgId), slotId), {
    clientIds: arrayRemove(clientId),
  })

// ── Recurrences ───────────────────────────────────────────────────────────────

export const getTrainerRecurrences = async (orgId) => {
  const q    = query(collection(db, recurrencesPath(orgId)))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

export const getGroupRecurrences = async (orgId, groupId) => {
  const q    = query(
    collection(db, recurrencesPath(orgId)),
    where('groupIds', 'array-contains', groupId),
    where('status', '==', 'active'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addRecurrence = (orgId, data) =>
  addDoc(collection(db, recurrencesPath(orgId)), {
    ...data,
    status:    'active',
    createdAt: new Date().toISOString(),
  })

export const updateRecurrence = (orgId, id, data) =>
  updateDoc(doc(db, recurrencesPath(orgId), id), data)

export const cancelRecurrence = (orgId, id) =>
  updateDoc(doc(db, recurrencesPath(orgId), id), { status: 'cancelled' })

export const deleteRecurrence = (orgId, id) =>
  deleteDoc(doc(db, recurrencesPath(orgId), id))

/**
 * Aggiunge un cliente a una ricorrenza e a tutti gli slot futuri collegati.
 */
export const addClientToRecurrence = async (orgId, recurrenceId, clientId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  batch.update(doc(db, recurrencesPath(orgId), recurrenceId), {
    clientIds: arrayUnion(clientId),
  })

  const q    = query(
    collection(db, slotsPath(orgId)),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, { clientIds: arrayUnion(clientId) })
  })

  return batch.commit()
}

/**
 * Rimuove un cliente da una ricorrenza e da tutti gli slot futuri collegati.
 */
export const removeClientFromRecurrence = async (orgId, recurrenceId, clientId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  batch.update(doc(db, recurrencesPath(orgId), recurrenceId), {
    clientIds: arrayRemove(clientId),
  })

  const q    = query(
    collection(db, slotsPath(orgId)),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, { clientIds: arrayRemove(clientId) })
  })

  return batch.commit()
}

/**
 * Aggiorna gli slot futuri di una ricorrenza (orario/giorni).
 */
export const updateFutureSlots = async (orgId, recurrenceId, update) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  const q    = query(
    collection(db, slotsPath(orgId)),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, update)
  })

  return batch.commit()
}

/**
 * Elimina tutti gli slot futuri di una ricorrenza.
 */
export const deleteFutureSlots = async (orgId, recurrenceId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  const q    = query(
    collection(db, slotsPath(orgId)),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.delete(slotDoc.ref)
  })

  return batch.commit()
}

/**
 * Conta slot futuri di una ricorrenza (per preview nel dialog).
 */
export const countFutureSlots = async (orgId, recurrenceId) => {
  const today = new Date().toISOString().slice(0, 10)
  const q     = query(
    collection(db, slotsPath(orgId)),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  return snap.size
}

export { generateRecurrenceDates } from '../../utils/calendarUtils'
