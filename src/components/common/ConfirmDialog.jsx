import { useEffect, useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { Button } from '../ui'

/**
 * Modal generico di conferma.
 * Riusato per campionamento, creazione cliente e qualsiasi altra azione
 * che richiede una conferma esplicita prima di procedere.
 */
export function ConfirmDialog({ title, description, confirmLabel = 'CONFERMA', cancelLabel = 'ANNULLA', loading = false, variant = 'default', onConfirm, onCancel }) {
  const isDanger = variant === 'danger'
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, true)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(8,12,18,0.9)' }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="p-6 w-full max-w-sm rx-animate-in"
        style={{ background: 'var(--rx-surface)', border: '1px solid var(--rx-border)', borderRadius: '4px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="font-display font-black text-[16px] text-white m-0 mb-2">
          {title}
        </h3>
        {description && (
          <p className="font-body text-[13px] text-white/40 leading-relaxed m-0 mb-5">{description}</p>
        )}
        <div className="flex gap-3">
          <Button variant="neutral" size="sm" className="flex-1" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'dangerGhost' : 'primary'}
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}