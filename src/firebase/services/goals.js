import {
  collection, getDocs,
  query, orderBy,
} from 'firebase/firestore'
import { db }        from './db'
import { goalsPath } from '../paths'

export const getGoals = async (orgId, clientId) => {
  try {
    const q    = query(collection(db, goalsPath(orgId, clientId)), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}
