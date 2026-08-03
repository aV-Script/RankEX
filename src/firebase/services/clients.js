import {
  collection, getDocs, getDoc, updateDoc,
  doc, query,
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

// updateClient rimane — usato per aggiornamenti diretti a basso rischio (peso/altezza
// in useMisure.js, avatarId in AvatarPicker.jsx). BIA e campionamenti passano invece da
// Cloud Functions callable (saveBiaUseCase → salvaBia, ecc.) — vedi usecases/.
export const updateClient = (orgId, id, data) => updateDoc(doc(db, clientsPath(orgId), id), data)
