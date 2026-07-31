import { useRef }       from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { Button }       from '../ui'

/**
 * Avviso mostrato 60s prima del logout automatico per inattività
 * (vedi hooks/useSessionTimeout.js). Qualsiasi interazione con la pagina
 * resetta già il timer altrove — questo dialog offre un'azione esplicita
 * per chi è semplicemente fermo a leggere.
 */
export function SessionWarningDialog({ onExtend }) {
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, true)

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] px-4 w-full max-w-sm"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
        className="rx-card p-4 flex items-center gap-4"
        style={{ borderColor: 'color-mix(in srgb, #f59e0b 35%, transparent)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      >
        <div className="flex-1 min-w-0">
          <div id="session-warning-title" className="font-display font-bold text-[12px]" style={{ color: '#f59e0b' }}>
            Sessione in scadenza
          </div>
          <p className="font-body text-[12px] text-white/60 m-0 mt-0.5">
            Verrai disconnesso a breve per inattività.
          </p>
        </div>
        <Button onClick={onExtend} size="sm" className="shrink-0 tracking-wider">
          RESTA CONNESSO
        </Button>
      </div>
    </div>
  )
}
