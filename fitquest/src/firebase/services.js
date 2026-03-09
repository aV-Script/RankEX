import { auth, db } from './config'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

// ── AUTH ─────────────────────────────────────────────────────

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const register = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const logout = () => signOut(auth)

export const onAuthChange = (callback) =>
  onAuthStateChanged(auth, callback)

// ── CLIENTI ──────────────────────────────────────────────────

export async function getClients(trainerId) {
  const q = query(
    collection(db, 'clients'),
    where('trainerId', '==', trainerId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addClient(trainerId, clientData) {
  return addDoc(collection(db, 'clients'), {
    ...clientData,
    trainerId,
    createdAt: serverTimestamp(),
  })
}

export async function updateClient(clientId, data) {
  return updateDoc(doc(db, 'clients', clientId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ── SESSIONI ─────────────────────────────────────────────────

export async function addSession(clientId, sessionData) {
  return addDoc(collection(db, 'clients', clientId, 'sessions'), {
    ...sessionData,
    date: serverTimestamp(),
  })
}

export async function getSessions(clientId) {
  const q = query(
    collection(db, 'clients', clientId, 'sessions'),
    orderBy('date', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}
