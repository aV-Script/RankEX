import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from './db'

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
    status:    'planned',
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
    status:    'completed',
    attendees,
    absentees,
  })

export const skipSlot = (id) =>
  updateDoc(doc(db, 'slots', id), {
    status:    'skipped',
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

export const addRecurrence = (data) =>
  addDoc(collection(db, 'recurrences'), {
    ...data,
    createdAt: new Date().toISOString(),
  })

export const deleteRecurrence = (id) =>
  deleteDoc(doc(db, 'recurrences', id))

/**
 * Genera tutte le date in un intervallo per i giorni della settimana dati.
 * @param {string}   startDate — 'YYYY-MM-DD'
 * @param {string}   endDate   — 'YYYY-MM-DD'
 * @param {number[]} days      — [0=Dom, 1=Lun, ..., 6=Sab]
 */
export function generateRecurrenceDates(startDate, endDate, days) {
  const dates  = []
  const cursor = new Date(startDate + 'T12:00')
  const end    = new Date(endDate   + 'T12:00')

  while (cursor <= end) {
    if (days.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().slice(0, 10))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}