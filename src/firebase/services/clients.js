import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  doc, query, where
} from 'firebase/firestore'
import { db } from './db'

export const getClients    = async (trainerId) => {
  const q    = query(collection(db, 'clients'), where('trainerId', '==', trainerId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClientById = async (clientId) => {
  const snap = await getDoc(doc(db, 'clients', clientId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const addClient    = (trainerId, data) => addDoc(collection(db, 'clients'), data)
export const updateClient = (id, data)        => updateDoc(doc(db, 'clients', id), data)

  
export const deleteClient = (id) => deleteDoc(doc(db, 'clients', id))