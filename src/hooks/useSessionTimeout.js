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

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']

// mousemove e scroll scattano decine di volte al secondo: basta azzerare i timer
// al massimo una volta ogni pochi secondi
const ACTIVITY_THROTTLE_MS = 5000

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

    let warningVisible = false
    let lastReset      = 0

    const reset = () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
      warningVisible = false
      lastReset      = Date.now()
      setShowWarning(false)
      warnTimerRef.current = setTimeout(() => {
        warningVisible = true
        setShowWarning(true)
      }, Math.max(timeout - WARNING_MS, 0))
      logoutTimerRef.current = setTimeout(() => logout(), timeout)
    }
    resetRef.current = reset

    // Con l'avviso visibile l'attività generica non estende la sessione: prima il
    // primo movimento del mouse lo chiudeva prima che si potesse leggere. Si
    // estende solo con "Resta collegato" (extendSession).
    const onActivity = () => {
      if (warningVisible) return
      if (Date.now() - lastReset < ACTIVITY_THROTTLE_MS) return
      reset()
    }

    reset()
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }))

    return () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity))
    }
  }, [role])

  return { showWarning, extendSession: () => resetRef.current() }
}
