import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from './db'

// ─── SLOTS ───────────────────────────────────────────────────────────────────
// Un slot = un allenamento in una data/ora con N clienti.
// Più clienti/gruppi possono condividere lo stesso slot.

export const getTrainerSlots = async (trainerId, dateFrom, dateTo) => {
  const q    = query(
    collection(db, 'slots'),
    where('trainerId', '==', trainerId),
    where('date', '>=', dateFrom),
    where('date', '<=', dateTo)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClientSlots = async (clientId, dateFrom, dateTo) => {
  const q    = query(
    collection(db, 'slots'),
    where('clientIds', 'array-contains', clientId),
    where('date', '>=', dateFrom),
    where('date', '<=', dateTo)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getSlotsByGroup = async (trainerId, groupId, dateFrom) => {
  const q    = query(
    collection(db, 'slots'),
    where('trainerId', '==', trainerId),
    where('groupIds', 'array-contains', groupId),
    where('date', '>=', dateFrom)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addSlot = (data) =>
  addDoc(collection(db, 'slots'), {
    clientIds:          [],
    groupIds:           [],
    completedClientIds: [],
    recurrenceId:       null,
    ...data,
    createdAt: new Date().toISOString(),
  })

export const updateSlot = (id, data) => updateDoc(doc(db, 'slots', id), data)
export const deleteSlot = (id)       => deleteDoc(doc(db, 'slots', id))

// Aggiunge un cliente a uno slot esistente
export const addClientToSlot = (slotId, clientId) =>
  updateDoc(doc(db, 'slots', slotId), { clientIds: arrayUnion(clientId) })

// Rimuove un cliente da uno slot esistente
export const removeClientFromSlot = (slotId, clientId) =>
  updateDoc(doc(db, 'slots', slotId), {
    clientIds:          arrayRemove(clientId),
    completedClientIds: arrayRemove(clientId),
  })

// ─── RECURRENCES ─────────────────────────────────────────────────────────────

export const getRecurrences = async (trainerId) => {
  const q    = query(collection(db, 'recurrences'), where('trainerId', '==', trainerId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addRecurrence = (data) =>
  addDoc(collection(db, 'recurrences'), {
    ...data,
    createdAt: new Date().toISOString(),
  })

export const deleteRecurrence = (id) => deleteDoc(doc(db, 'recurrences', id))

/**
 * Genera le date di una ricorrenza dati i giorni della settimana e il range.
 * days: array di numeri 0-6 (0=Dom, 1=Lun, ..., 6=Sab)
 */
export function generateRecurrenceDates(startDate, endDate, days) {
  const dates = []
  const start = new Date(startDate + 'T12:00:00')
  const end   = new Date(endDate   + 'T12:00:00')
  const cur   = new Date(start)

  while (cur <= end) {
    if (days.includes(cur.getDay())) {
      dates.push(cur.toISOString().slice(0, 10))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}
