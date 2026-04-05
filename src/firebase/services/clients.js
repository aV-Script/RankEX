import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  doc, query, where, writeBatch, increment,
} from 'firebase/firestore'
import { db }          from './db'
import { clientsPath } from '../paths'

export const getClients    = async (orgId) => {
  const q    = query(collection(db, clientsPath(orgId)))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getClientById = async (orgId, clientId) => {
  const snap = await getDoc(doc(db, clientsPath(orgId), clientId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Batch: crea cliente + incrementa clientCount sull'org.
export const addClient = async (orgId, data) => {
  const clientRef = doc(collection(db, clientsPath(orgId)))
  const orgRef    = doc(db, 'organizations', orgId)
  const batch     = writeBatch(db)
  batch.set(clientRef, data)
  batch.update(orgRef, { clientCount: increment(1) })
  await batch.commit()
  return clientRef
}

export const updateClient = (orgId, id, data) => updateDoc(doc(db, clientsPath(orgId), id), data)

// Batch: elimina cliente + decrementa clientCount sull'org.
export const deleteClient = async (orgId, id) => {
  const clientRef = doc(db, clientsPath(orgId), id)
  const orgRef    = doc(db, 'organizations', orgId)
  const batch     = writeBatch(db)
  batch.delete(clientRef)
  batch.update(orgRef, { clientCount: increment(-1) })
  await batch.commit()
}
