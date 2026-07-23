import {
  collection, getDocs, deleteDoc,
  doc, query, where,
} from 'firebase/firestore'
import { db }               from './db'
import { notificationsPath } from '../paths'

export const getNotifications = async (orgId, clientId) => {
  try {
    const q    = query(
      collection(db, notificationsPath(orgId)),
      where('clientId', '==', clientId),
    )
    const snap = await getDocs(q)
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch {
    return []
  }
}

export const deleteNotification = (orgId, id) =>
  deleteDoc(doc(db, notificationsPath(orgId), id))
