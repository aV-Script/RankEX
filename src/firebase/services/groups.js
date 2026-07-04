import {
  collection, getDocs,
  query,
} from 'firebase/firestore'
import { db }         from './db'
import { groupsPath } from '../paths'

// Struttura gruppo: { id, name, clientIds: [] }

export const getGroups = async (orgId) => {
  const q    = query(collection(db, groupsPath(orgId)))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
