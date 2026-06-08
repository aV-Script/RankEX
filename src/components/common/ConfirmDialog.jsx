import { useEffect } from 'react'

/**
 * Modal generico di conferma.
 * Riusato per campionamento, creazione cliente e qualsiasi altra azione
 * che richiede una conferma esplicita prima di procedere.
 */
export function ConfirmDialog({ title, description, confirmLabel = 'CONFERMA', cancelLabel = 'ANNULLA', loading = false, variant = 'default', onConfirm, onCancel }) {
  const isDanger = variant === 'danger'
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
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 font-display text-[12px] cursor-pointer bg-transparent text-white/40 hover:text-white/70 transition-all disabled:opacity-50"
            style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 font-display text-[12px] cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-50"
            style={isDanger
              ? { background: 'color-mix(in srgb, #f87171 7%, transparent)', border: '1px solid color-mix(in srgb, #f87171 35%, transparent)', borderRadius: '3px', color: '#f87171', fontWeight: 700 }
              : { background: 'color-mix(in srgb, var(--rx-green) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-green) 35%, transparent)', borderRadius: '3px', color: 'var(--rx-green)', fontWeight: 700 }
            }
          >
            {loading ? 'ATTENDERE...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}