import { useEffect, useRef, useState } from 'react'
import { logout }            from '../firebase/services/auth'

const TIMEOUT_MS = {
  super_admin:    30 * 60 * 1000,          //  30 minuti
  org_admin:       2 * 60 * 60 * 1000,    //   2 ore
  trainer:         8 * 60 * 60 * 1000,    //   8 ore
  staff_readonly:  8 * 60 * 60 * 1000,    //   8 ore
  client:          24 * 60 * 60 * 1000,       // 24 ore
}

const WARNING_MS = 60 * 1000   // preavviso prima del logout automatico

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll']

/**
 * Esegue il logout automatico dopo un periodo di inattività.
 * Il timer si azzera ad ogni interazione utente.
 * Mostra un avviso (showWarning) 60s prima della scadenza, con la possibilità
 * di estendere la sessione tramite extendSession().
 *
 * @param {string|null|undefined} role — ruolo dell'utente loggato
 * @returns {{ showWarning: boolean, extendSession: () => void }}
 */
export function useSessionTimeout(role) {
  const warnTimerRef   = useRef(null)
  const logoutTimerRef = useRef(null)
  const resetRef       = useRef(() => {})
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!role) return

    const timeout = TIMEOUT_MS[role] ?? TIMEOUT_MS.trainer

    const reset = () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
      setShowWarning(false)
      warnTimerRef.current   = setTimeout(() => setShowWarning(true), Math.max(timeout - WARNING_MS, 0))
      logoutTimerRef.current = setTimeout(() => logout(), timeout)
    }
    resetRef.current = reset

    reset()
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))

    return () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset))
    }
  }, [role])

  return { showWarning, extendSession: () => resetRef.current() }
}
