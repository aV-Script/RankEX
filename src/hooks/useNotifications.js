import { useState, useEffect, useCallback } from 'react'
import {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification,
} from '../firebase/services/notifications'

const NOTIF_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 giorni

/**
 * Gestisce il ciclo di vita completo delle notifiche cliente:
 * - fetch iniziale
 * - auto-rimozione dopo 7 giorni se già lette
 * - mark all read (con readAt)
 * - delete singola
 */
export function useNotifications(clientId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  useEffect(() => {
    if (!clientId) return
    getNotifications(clientId).then(raw => {
      const now = Date.now()
      const fresh = []
      raw.forEach(n => {
        const readAt = n.readAt ? new Date(n.readAt).getTime() : null
        if (n.read && readAt && (now - readAt) > NOTIF_TTL_MS) {
          deleteNotification(n.id).catch(() => {})
        } else {
          fresh.push(n)
        }
      })
      setNotifications(fresh)
      setUnreadCount(fresh.filter(n => !n.read).length)
    })
  }, [clientId])

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    await markAllNotificationsRead(clientId, readAt)
    setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true, readAt }))
    setUnreadCount(0)
  }, [clientId])

  const remove = useCallback(async (id) => {
    await deleteNotification(id).catch(() => {})
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id)
      setUnreadCount(next.filter(n => !n.read).length)
      return next
    })
  }, [])

  return { notifications, unreadCount, markAllRead, remove }
}
