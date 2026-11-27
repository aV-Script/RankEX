import { IconClose } from '../ui/icons'

// Fondo scuro (L3) con bordo e icona colorati per esito: colori fissi, non
// tema-dipendenti, come --rx-danger/--rx-gold in index.css.
const VARIANT = {
  success: { color: '#34d399', icon: '✓' },
  error:   { color: '#f87171', icon: '✕' },
  warning: { color: '#f59e0b', icon: '!' },
  info:    { color: '#2ecfff', icon: 'i' },
}

const CLOSE_TARGET_PX = 32

export function Toast({ toasts, onRemove }) {
  // Regione live sempre montata (altrimenti gli screen reader non annunciano il
  // primo toast); gli errori hanno role="alert" sul singolo item.
  // Sotto lg: 76px sopra il fondo, cioè sopra la bottom nav (fixed bottom-0)
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed z-[10001] flex flex-col gap-2 pointer-events-none bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-4 right-4 left-4"
      style={{ maxWidth: '20rem', marginLeft: 'auto' }}
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
      role={toast.variant === 'error' ? 'alert' : undefined}
      className="toast-in flex items-center gap-3 pl-4 pr-1 py-1 rounded-[3px] pointer-events-auto"
      style={{
        background: 'var(--rx-card-bg)',
        border: `1px solid ${v.color}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        minHeight: CLOSE_TARGET_PX + 8,
      }}
    >
      <span className="font-display text-sm font-bold shrink-0" style={{ color: v.color }} aria-hidden="true">{v.icon}</span>
      <p className="flex-1 font-body text-white text-[13px] m-0 leading-tight py-2">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Chiudi messaggio"
        className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer p-0 flex items-center justify-center shrink-0"
        style={{ width: CLOSE_TARGET_PX, height: CLOSE_TARGET_PX }}
      >
        <IconClose size={11} />
      </button>
    </div>
  )
}
