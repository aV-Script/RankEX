import {
  collection, getDocs, getDoc, updateDoc, deleteDoc,
  doc, query, orderBy, setDoc,
} from 'firebase/firestore'
import { db } from './db'
import { membersPath } from '../paths'

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
    collection(db, membersPath(orgId)),
    orderBy('joinedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getMember = async (orgId, uid) => {
  const snap = await getDoc(doc(db, membersPath(orgId), uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Membri — update diretto (solo cambio ruolo, no counter coinvolto) ─────────
// La rimozione invece passa da usecases/removeMemberUseCase.js → Cloud Function
// rimuoviMembroTeam (anche per super_admin, che la Cloud Function autorizza
// esplicitamente): serve a cancellare /users/{uid}, l'account Auth e a
// decrementare memberCount — un deleteDoc diretto sul solo membro lasciava
// l'account attivo e capace di accedere all'org anche dopo la "rimozione".

export const updateMember = (orgId, uid, data) =>
  updateDoc(doc(db, membersPath(orgId), uid), data)
