import {
  collection, getDocs,
  doc, query, where, orderBy,
} from 'firebase/firestore'
import { db }                         from './db'
import { slotsPath, recurrencesPath } from '../paths'

// ── Slots — solo lettura ──────────────────────────────────────────────────────

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

// ── Recurrences — solo lettura ────────────────────────────────────────────────

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
