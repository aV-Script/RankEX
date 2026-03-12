import {
  getFirestore, collection, getDocs, addDoc, updateDoc, getDoc, deleteDoc,
  doc, query, where, arrayUnion, orderBy
} from 'firebase/firestore'
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import app from './config'

const db   = getFirestore(app)
const auth = getAuth(app)

const firebaseConfig = {
  apiKey:            "AIzaSyABkp7d91Wb2JG0SsJzDIhrceH_cma0Qc0",
  authDomain:        "fitquest-60a09.firebaseapp.com",
  projectId:         "fitquest-60a09",
  storageBucket:     "fitquest-60a09.firebasestorage.app",
  messagingSenderId: "684894217887",
  appId:             "1:684894217887:web:685adbbd3b67254de3e4aa",
}
const secondaryApp  = initializeApp(firebaseConfig, 'secondary')
const secondaryAuth = getAuth(secondaryApp)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login        = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
export const register     = (email, pw) => createUserWithEmailAndPassword(auth, email, pw)
export const logout       = ()          => signOut(auth)
export const onAuthChange = (cb)        => onAuthStateChanged(auth, cb)

export async function createClientAccount(email, password) {
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  await signOut(secondaryAuth)
  return cred.user.uid
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function updateUserProfile(uid, data) {
  return updateDoc(doc(db, 'users', uid), data)
}

// ── Clients ───────────────────────────────────────────────────────────────────
export async function getClients(trainerId) {
  const q    = query(collection(db, 'clients'), where('trainerId', '==', trainerId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getClientById(clientId) {
  const snap = await getDoc(doc(db, 'clients', clientId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const addClient    = (trainerId, data) => addDoc(collection(db, 'clients'), data)
export const updateClient = (id, data)        => updateDoc(doc(db, 'clients', id), data)
export const addSession   = (clientId, data)  =>
  updateDoc(doc(db, 'clients', clientId), { sessions: arrayUnion({ ...data, createdAt: new Date().toISOString() }) })

// ── Missions ──────────────────────────────────────────────────────────────────
export async function getMissions(clientId) {
  const q    = query(collection(db, 'missions'), where('clientId', '==', clientId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addMission    = (data)     => addDoc(collection(db, 'missions'), data)
export const updateMission = (id, data) => updateDoc(doc(db, 'missions', id), data)
export const deleteMission = (id)       => deleteDoc(doc(db, 'missions', id))

// ── Mission Templates ─────────────────────────────────────────────────────────
export async function getCustomTemplates(trainerId) {
  const q    = query(collection(db, 'missionTemplates'), where('trainerId', '==', trainerId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const saveTemplate = (trainerId, data) =>
  addDoc(collection(db, 'missionTemplates'), { ...data, trainerId })

// ── Notifications ─────────────────────────────────────────────────────────────
export async function getNotifications(clientId) {
  try {
    const q    = query(collection(db, 'notifications'), where('clientId', '==', clientId))
    const snap = await getDocs(q)
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (err) {
    console.error('getNotifications error:', err)
    return []
  }
}

export const addNotification      = (data) =>
  addDoc(collection(db, 'notifications'), { ...data, read: false, createdAt: new Date().toISOString() })

export const markNotificationRead = (id) =>
  updateDoc(doc(db, 'notifications', id), { read: true })

export const markAllNotificationsRead = async (clientId) => {
  const notifs = await getNotifications(clientId)
  await Promise.all(notifs.filter(n => !n.read).map(n => markNotificationRead(n.id)))
}

