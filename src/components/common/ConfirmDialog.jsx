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
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
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
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/70 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
          >
            {loading ? 'ATTENDERE...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}