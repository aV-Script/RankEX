import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, arrayUnion, arrayRemove,
  writeBatch,
} from 'firebase/firestore'
import { db } from './db'
import { SLOT_STATUS } from '../../constants/slotStatus'

// ── Slots ─────────────────────────────────────────────────────────────────────

export const getTrainerSlots = async (trainerId, from, to) => {
  const q    = query(
    collection(db, 'slots'),
    where('trainerId', '==', trainerId),
    where('date', '>=', from),
    where('date', '<=', to),
    orderBy('date'),
    orderBy('startTime'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClientSlots = async (clientId, from, to) => {
  const q    = query(
    collection(db, 'slots'),
    where('clientIds', 'array-contains', clientId),
    where('date', '>=', from),
    where('date', '<=', to),
    orderBy('date'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getSlotsByGroup = async (trainerId, groupId, fromDate) => {
  const q    = query(
    collection(db, 'slots'),
    where('trainerId', '==', trainerId),
    where('groupIds', 'array-contains', groupId),
    where('date', '>=', fromDate),
    orderBy('date'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addSlot = (data) =>
  addDoc(collection(db, 'slots'), {
    ...data,
    status:    SLOT_STATUS.PLANNED,
    attendees: [],
    absentees: [],
    createdAt: new Date().toISOString(),
  })

export const updateSlot = (id, data) =>
  updateDoc(doc(db, 'slots', id), data)

export const deleteSlot = (id) =>
  deleteDoc(doc(db, 'slots', id))

export const closeSlot = (id, { attendees, absentees }) =>
  updateDoc(doc(db, 'slots', id), {
    status:    SLOT_STATUS.COMPLETED,
    attendees,
    absentees,
  })

export const skipSlot = (id) =>
  updateDoc(doc(db, 'slots', id), {
    status:    SLOT_STATUS.SKIPPED,
    attendees: [],
    absentees: [],
  })

export const addClientToSlot = (slotId, clientId) =>
  updateDoc(doc(db, 'slots', slotId), {
    clientIds: arrayUnion(clientId),
  })

export const removeClientFromSlot = (slotId, clientId) =>
  updateDoc(doc(db, 'slots', slotId), {
    clientIds: arrayRemove(clientId),
  })

// ── Recurrences ───────────────────────────────────────────────────────────────

export const getTrainerRecurrences = async (trainerId) => {
  const q    = query(
    collection(db, 'recurrences'),
    where('trainerId', '==', trainerId),
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  // Ordine client-side per evitare indice composito non ancora deployato
  return docs.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}

export const getGroupRecurrences = async (trainerId, groupId) => {
  const q    = query(
    collection(db, 'recurrences'),
    where('trainerId', '==', trainerId),
    where('groupIds', 'array-contains', groupId),
    where('status', '==', 'active'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addRecurrence = (data) =>
  addDoc(collection(db, 'recurrences'), {
    ...data,
    status:    'active',
    createdAt: new Date().toISOString(),
  })

export const updateRecurrence = (id, data) =>
  updateDoc(doc(db, 'recurrences', id), data)

export const cancelRecurrence = (id) =>
  updateDoc(doc(db, 'recurrences', id), { status: 'cancelled' })

export const deleteRecurrence = (id) =>
  deleteDoc(doc(db, 'recurrences', id))

/**
 * Aggiunge un cliente a una ricorrenza e a tutti
 * gli slot futuri collegati.
 */
export const addClientToRecurrence = async (recurrenceId, clientId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  batch.update(doc(db, 'recurrences', recurrenceId), {
    clientIds: arrayUnion(clientId),
  })

  const q    = query(
    collection(db, 'slots'),
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
 * Rimuove un cliente da una ricorrenza e da tutti
 * gli slot futuri collegati.
 */
export const removeClientFromRecurrence = async (recurrenceId, clientId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  batch.update(doc(db, 'recurrences', recurrenceId), {
    clientIds: arrayRemove(clientId),
  })

  const q    = query(
    collection(db, 'slots'),
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
 * Aggiorna gli slot futuri di una ricorrenza
 * (usato quando si modifica orario/giorni).
 */
export const updateFutureSlots = async (recurrenceId, update) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  const q    = query(
    collection(db, 'slots'),
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
export const deleteFutureSlots = async (recurrenceId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  const q    = query(
    collection(db, 'slots'),
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
export const countFutureSlots = async (recurrenceId) => {
  const today = new Date().toISOString().slice(0, 10)
  const q     = query(
    collection(db, 'slots'),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  return snap.size
}

export { generateRecurrenceDates } from '../../utils/calendarUtils'
