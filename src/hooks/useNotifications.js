import { useState, useEffect, useCallback } from 'react'
import {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification,
} from '../firebase/services/notifications'

const NOTIF_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 giorni

/**
 * Gestisce il ciclo di vita completo delle notifiche cliente.
 *
 * @param {string} orgId    — ID organizzazione
 * @param {string} clientId — ID cliente
 */
export function useNotifications(orgId, clientId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  useEffect(() => {
    if (!orgId || !clientId) return
    getNotifications(orgId, clientId).then(raw => {
      const now   = Date.now()
      const fresh = []
      raw.forEach(n => {
        const readAt = n.readAt ? new Date(n.readAt).getTime() : null
        if (n.read && readAt && (now - readAt) > NOTIF_TTL_MS) {
          deleteNotification(orgId, n.id).catch(() => {})
        } else {
          fresh.push(n)
        }
      })
      setNotifications(fresh)
      setUnreadCount(fresh.filter(n => !n.read).length)
    })
  }, [orgId, clientId])

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    await markAllNotificationsRead(orgId, clientId, readAt)
    setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true, readAt }))
    setUnreadCount(0)
  }, [orgId, clientId])

  const remove = useCallback(async (id) => {
    await deleteNotification(orgId, id).catch(() => {})
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id)
      setUnreadCount(next.filter(n => !n.read).length)
      return next
    })
  }, [orgId])

  return { notifications, unreadCount, markAllRead, remove }
}
