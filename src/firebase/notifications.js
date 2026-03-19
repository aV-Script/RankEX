import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where,
} from 'firebase/firestore'
import { db } from './db'

export const getNotifications = async (clientId) => {
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

export const addNotification = (data) =>
  addDoc(collection(db, 'notifications'), {
    ...data,
    read:      false,
    createdAt: new Date().toISOString(),
  })

export const markNotificationRead = (id) =>
  updateDoc(doc(db, 'notifications', id), { read: true })

export const markAllNotificationsRead = async (clientId, readAt = new Date().toISOString()) => {
  const notifs = await getNotifications(clientId)
  await Promise.all(
    notifs.filter(n => !n.read).map(n =>
      updateDoc(doc(db, 'notifications', n.id), { read: true, readAt })
    )
  )
}

export const deleteNotification = (id) => deleteDoc(doc(db, 'notifications', id))
