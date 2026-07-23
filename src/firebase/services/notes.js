import {
  collection, getDocs,
  query, orderBy,
} from 'firebase/firestore'
import { db }        from './db'
import { notesPath } from '../paths'

export const getNotes = async (orgId, clientId) => {
  try {
    const q    = query(collection(db, notesPath(orgId, clientId)), orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}
