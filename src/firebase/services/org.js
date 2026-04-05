import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, setDoc, writeBatch, increment,
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

// ── Membri ────────────────────────────────────────────────────────────────────

export const getMembers = async (orgId) => {
  const q    = query(
    collection(db, `organizations/${orgId}/members`),
    orderBy('joinedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addMember = async (orgId, uid, data) => {
  const memberRef = doc(db, `organizations/${orgId}/members`, uid)
  const orgRef    = doc(db, 'organizations', orgId)
  const batch     = writeBatch(db)
  batch.set(memberRef, { ...data, joinedAt: new Date().toISOString() })
  batch.update(orgRef, { memberCount: increment(1) })
  await batch.commit()
}

export const updateMember = (orgId, uid, data) =>
  updateDoc(doc(db, `organizations/${orgId}/members`, uid), data)

export const removeMember = async (orgId, uid) => {
  const memberRef = doc(db, `organizations/${orgId}/members`, uid)
  const orgRef    = doc(db, 'organizations', orgId)
  const batch     = writeBatch(db)
  batch.delete(memberRef)
  batch.update(orgRef, { memberCount: increment(-1) })
  await batch.commit()
}
