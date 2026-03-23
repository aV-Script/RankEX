const VARIANT = {
  success: { bg: '#059669', icon: '✓' },
  error:   { bg: '#dc2626', icon: '✕' },
  warning: { bg: '#d97706', icon: '!' },
  info:    { bg: '#2563eb', icon: 'i' },
}

export function Toast({ toasts, onRemove }) {
  if (toasts.length === 0) return null
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ bottom: '1rem', right: '1rem', left: '1rem', maxWidth: '20rem', marginLeft: 'auto' }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const v = VARIANT[toast.variant] ?? VARIANT.info
  return (
    <div
      className="toast-in flex items-center gap-3 px-4 py-3 rounded-xl pointer-events-auto"
      style={{ background: v.bg, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
    >
      <span className="font-display text-white text-sm font-bold shrink-0">{v.icon}</span>
      <p className="flex-1 font-body text-white text-[13px] m-0 leading-tight">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Chiudi notifica"
        className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer p-0 text-sm leading-none shrink-0"
      >
        ✕
      </button>
    </div>
  )
}
