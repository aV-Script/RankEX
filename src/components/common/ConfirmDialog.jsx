import { useEffect } from 'react'

/**
 * Modal generico di conferma.
 * Riusato per campionamento, creazione cliente e qualsiasi altra azione
 * che richiede una conferma esplicita prima di procedere.
 */
export function ConfirmDialog({ title, description, confirmLabel = 'CONFERMA', cancelLabel = 'ANNULLA', loading = false, onConfirm, onCancel }) {
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
        className="p-6 w-full max-w-sm"
        style={{ background: '#0d1520', border: '1px solid rgba(15,214,90,0.15)', borderRadius: '4px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="font-display font-black text-[16px] text-white mb-2">
          {title}
        </h3>
        {description && (
          <p className="font-body text-[13px] text-white/50 mb-6">{description}</p>
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
            style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', borderRadius: '3px', color: '#080c12', fontWeight: 700 }}
          >
            {loading ? 'ATTENDERE...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}