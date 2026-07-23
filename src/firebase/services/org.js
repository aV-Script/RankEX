import {
  collection, getDocs, getDoc, updateDoc, deleteDoc,
  doc, query, orderBy, setDoc,
} from 'firebase/firestore'
import { db } from './db'

// ── Organizzazioni ────────────────────────────────────────────────────────────

export const getOrganizations = async () => {
  const q    = query(collection(db, 'organizations'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getOrganization = async (orgId) => {
  const snap = await getDoc(doc(db, 'organizations', orgId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const createOrganization = (orgId, data) =>
  setDoc(doc(db, 'organizations', orgId), {
    ...data,
    status:    'active',
    createdAt: new Date().toISOString(),
  })

export const updateOrganization = (orgId, data) =>
  updateDoc(doc(db, 'organizations', orgId), data)

export const deleteOrganization = (orgId) =>
  deleteDoc(doc(db, 'organizations', orgId))

// ── Membri — solo lettura ─────────────────────────────────────────────────────

export const getMembers = async (orgId) => {
  const q    = query(
    collection(db, `organizations/${orgId}/members`),
    orderBy('joinedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Membri — solo super_admin (operazioni dirette senza counter) ──────────────

export const removeMember = (orgId, uid) =>
  deleteDoc(doc(db, `organizations/${orgId}/members`, uid))

export const updateMember = (orgId, uid, data) =>
  updateDoc(doc(db, `organizations/${orgId}/members`, uid), data)
