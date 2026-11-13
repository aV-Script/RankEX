import { useState, useEffect, useCallback } from 'react'
import { getUpcomingClientSlots } from '../../firebase/services/calendar'
import { toLocalDateStr } from '../../utils/calendarUtils'
import { pickUpcomingPlanned } from '../../utils/upcomingSessions'

const UPCOMING_FETCH_LIMIT = 20

const STATUS_LOADING = 'loading'
const STATUS_READY   = 'ready'
const STATUS_ERROR   = 'error'

const NO_SESSIONS = []

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
 * Senza orgId o clientId non c'è nulla da leggere: 'ready' e lista vuota. Cambiando cliente
 * (o ripetendo) lo stato torna a 'loading' finché non arriva la lettura del nuovo.
 *
 * @param {string} orgId
 * @param {string} clientId
 */
export function useUpcomingSessions(orgId, clientId) {
  const [result,    setResult]    = useState({ key: null, sessions: NO_SESSIONS, status: STATUS_LOADING })
  const [reloadKey, setReloadKey] = useState(0)

  const today   = toLocalDateStr()
  const hasTarget = Boolean(orgId && clientId)
  const dataKey = `${orgId}|${clientId}|${today}|${reloadKey}`

  useEffect(() => {
    if (!hasTarget) return
    let cancelled = false
    fetchUpcoming(orgId, clientId, today)
      .then(data => {
        if (cancelled) return
        setResult({ key: dataKey, sessions: pickUpcomingPlanned(data, clientId), status: STATUS_READY })
      })
      .catch(() => {
        if (!cancelled) setResult({ key: dataKey, sessions: NO_SESSIONS, status: STATUS_ERROR })
      })
    return () => { cancelled = true }
  }, [orgId, clientId, today, hasTarget, dataKey])

  const retry = useCallback(() => setReloadKey(key => key + 1), [])

  if (!hasTarget) return { sessions: NO_SESSIONS, status: STATUS_READY, retry }
  if (result.key !== dataKey) return { sessions: NO_SESSIONS, status: STATUS_LOADING, retry }
  return { sessions: result.sessions, status: result.status, retry }
}
