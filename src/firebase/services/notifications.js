import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, writeBatch,
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

export const addNotification = (orgId, data) =>
  addDoc(collection(db, notificationsPath(orgId)), {
    ...data,
    read:      false,
    createdAt: new Date().toISOString(),
  })

export const markNotificationRead = (orgId, id) =>
  updateDoc(doc(db, notificationsPath(orgId), id), { read: true })

export const markAllNotificationsRead = async (orgId, clientId, readAt = new Date().toISOString()) => {
  const notifs = await getNotifications(orgId, clientId)
  const unread = notifs.filter(n => !n.read)
  if (unread.length === 0) return
  const batch = writeBatch(db)
  unread.forEach(n => {
    batch.update(doc(db, notificationsPath(orgId), n.id), { read: true, readAt })
  })
  await batch.commit()
}

export const deleteNotification = (orgId, id) =>
  deleteDoc(doc(db, notificationsPath(orgId), id))
