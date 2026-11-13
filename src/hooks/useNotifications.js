import { useState, useEffect, useCallback } from 'react'
import {
  getNotifications,
  deleteNotification,
} from '../firebase/services/notifications'
import { markAllNotificationsReadUseCase } from '../usecases/markAllNotificationsReadUseCase'

const NOTIF_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 giorni

const STATUS_LOADING = 'loading'
const STATUS_READY   = 'ready'
const STATUS_ERROR   = 'error'

/**
 * Gestisce il ciclo di vita completo delle notifiche cliente.
 * `status`: 'loading' | 'ready' | 'error' ('ready' con lista vuota = nessuna notifica);
 * `retry` ripete il caricamento dopo un errore. Ordine: dalla più recente (service).
 *
 * @param {string} orgId    — ID organizzazione
 * @param {string} clientId — ID cliente
 */
export function useNotifications(orgId, clientId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [status,        setStatus]        = useState(STATUS_LOADING)
  const [reloadKey,     setReloadKey]     = useState(0)

  useEffect(() => {
    if (!orgId || !clientId) return
    // Cambiando cliente o ripetendo il caricamento, una risposta vecchia non deve
    // sovrascrivere quella attuale
    let cancelled = false
    getNotifications(orgId, clientId).then(raw => {
      if (cancelled) return
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
      setStatus(STATUS_READY)
    }).catch(() => {
      // Le notifiche non bloccano la dashboard: chi le mostra distingue l'errore
      // dal "nessuna notifica" tramite `status` e può ripetere con `retry`.
      if (!cancelled) setStatus(STATUS_ERROR)
    })
    return () => { cancelled = true }
  }, [orgId, clientId, reloadKey])

  const retry = useCallback(() => {
    setStatus(STATUS_LOADING)
    setReloadKey(key => key + 1)
  }, [])

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    try {
      await markAllNotificationsReadUseCase(orgId, clientId)
      setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true, readAt }))
      setUnreadCount(0)
    } catch {
      // silent — le notifiche rimangono non lette
    }
  }, [orgId, clientId])

  const remove = useCallback(async (id) => {
    await deleteNotification(orgId, id).catch(() => {})
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id)
      setUnreadCount(next.filter(n => !n.read).length)
      return next
    })
  }, [orgId])

  return { notifications, unreadCount, status, retry, markAllRead, remove }
}
