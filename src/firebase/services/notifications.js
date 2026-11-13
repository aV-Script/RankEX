import {
  collection, getDocs, deleteDoc,
  doc, query, where,
} from 'firebase/firestore'
import { db }               from './db'
import { notificationsPath } from '../paths'
import { sortNotificationsNewestFirst } from '../../utils/notifications'

export const getNotifications = async (orgId, clientId) => {
  const q    = query(
    collection(db, notificationsPath(orgId)),
    where('clientId', '==', clientId),
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return sortNotificationsNewestFirst(docs)
}

export const deleteNotification = (orgId, id) =>
  deleteDoc(doc(db, notificationsPath(orgId), id))
