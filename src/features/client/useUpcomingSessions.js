import { useState, useEffect, useCallback } from 'react'
import { getUpcomingClientSlots } from '../../firebase/services/calendar'
import { toLocalDateStr } from '../../utils/calendarUtils'
import { pickUpcomingPlanned } from '../../utils/upcomingSessions'

const UPCOMING_FETCH_LIMIT = 20

const STATUS_LOADING = 'loading'
const STATUS_READY   = 'ready'
const STATUS_ERROR   = 'error'

// Una sola lettura in volo per cliente e giorno: se Home e Calendario chiedono le
// prossime sessioni nello stesso momento condividono la stessa promise. Si svuota
// appena la lettura finisce, quindi un nuovo montaggio o un retry rileggono sempre
// dati freschi (nessuna cache che resti vecchia).
const inFlight = new Map()

function fetchUpcoming(orgId, clientId, today) {
  const key = `${orgId}|${clientId}|${today}`
  const pending = inFlight.get(key)
  if (pending) return pending
  const request = getUpcomingClientSlots(orgId, clientId, today, UPCOMING_FETCH_LIMIT)
    .finally(() => inFlight.delete(key))
  inFlight.set(key, request)
  return request
}

/**
 * Prossime sessioni pianificate del cliente da oggi, in ordine di data e ora.
 * `status`: 'loading' | 'ready' | 'error' ('ready' con lista vuota = nessuna sessione);
 * `retry` ripete la lettura dopo un errore. Chi mostra un sottoinsieme taglia da sé.
 *
 * @param {string} orgId
 * @param {string} clientId
 */
export function useUpcomingSessions(orgId, clientId) {
  const [sessions,  setSessions]  = useState([])
  const [status,    setStatus]    = useState(STATUS_LOADING)
  const [reloadKey, setReloadKey] = useState(0)

  const today = toLocalDateStr()

  useEffect(() => {
    if (!orgId || !clientId) return
    let cancelled = false
    fetchUpcoming(orgId, clientId, today)
      .then(data => {
        if (cancelled) return
        setSessions(pickUpcomingPlanned(data, clientId))
        setStatus(STATUS_READY)
      })
      .catch(() => { if (!cancelled) setStatus(STATUS_ERROR) })
    return () => { cancelled = true }
  }, [orgId, clientId, today, reloadKey])

  const retry = useCallback(() => {
    setStatus(STATUS_LOADING)
    setReloadKey(key => key + 1)
  }, [])

  return { sessions, status, retry }
}
