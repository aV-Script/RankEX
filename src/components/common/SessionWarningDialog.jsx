import { useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { WARNING_MS }   from '../../hooks/useSessionTimeout'
import { logout }       from '../../firebase/services/auth'
import { Button }       from '../ui'

const TICK_MS = 1000

function formatCountdown(ms) {
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

/**
 * Avviso mostrato WARNING_MS prima del logout automatico per inattività
 * (vedi hooks/useSessionTimeout.js, che lo monta all'inizio del preavviso).
 * Il conto alla rovescia visivo è aria-hidden: lo screen reader riceve una sola
 * volta il testo statico della regione polite, non un annuncio al secondo.
 */
export function SessionWarningDialog({ onExtend }) {
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, true)
  const [remainingMs, setRemainingMs] = useState(WARNING_MS)
  const [isExiting, setIsExiting] = useState(false)

  async function handleExit() {
    if (isExiting) return
    setIsExiting(true)
    try {
      await logout()
    } finally {
      setIsExiting(false)
    }
  }

  useEffect(() => {
    const deadline = Date.now() + WARNING_MS
    const interval = setInterval(() => setRemainingMs(Math.max(deadline - Date.now(), 0)), TICK_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] px-4 w-full max-w-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
        className="rx-card p-4 flex flex-col gap-3"
        style={{ borderColor: 'color-mix(in srgb, #f59e0b 35%, transparent)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div id="session-warning-title" className="font-display font-bold text-[13px]" style={{ color: '#f59e0b' }}>
            Stai ancora lavorando?
          </div>
          <div className="font-display font-bold text-[18px] text-white tabular-nums" aria-hidden="true">
            {formatCountdown(remainingMs)}
          </div>
        </div>
        <p className="font-body text-[12px] text-white/60 m-0">
          Verrai disconnesso per inattività allo scadere del tempo. Le modifiche non salvate andranno perse.
        </p>
        <span className="sr-only" aria-live="polite">
          Verrai disconnesso tra un minuto. Le modifiche non salvate andranno perse.
        </span>
        <div className="flex gap-2">
          <Button variant="neutral" onClick={() => handleExit()} loading={isExiting} size="sm" className="flex-1 tracking-wider">
            ESCI ORA
          </Button>
          <Button variant="primary" onClick={onExtend} size="sm" className="flex-1 tracking-wider">
            RESTA CONNESSO
          </Button>
        </div>
      </div>
    </div>
  )
}
