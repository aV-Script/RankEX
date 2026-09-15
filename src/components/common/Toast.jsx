import { IconClose } from '../ui/icons'

// Colori fissi (non tema-dipendenti), come --rx-danger/--rx-gold/--rx-silver in
// index.css: il Toast è un riempimento pieno con testo bianco sopra, non il
// pattern "colore + tinta trasparente" usato altrove — richiede tonalità più
// scure di --rx-accent/--rx-danger per restare leggibile (WCAG AA 4.5:1),
// quindi non può limitarsi a leggere le CSS variable del tema attivo.
const VARIANT = {
  success: { bg: '#047857', icon: '✓' }, // ~5.5:1 con testo bianco
  error:   { bg: '#dc2626', icon: '✕' }, // ~4.8:1
  warning: { bg: '#b45309', icon: '!' }, // ~5.0:1
  info:    { bg: '#0369a1', icon: 'i' }, // ~5.9:1
}

export function Toast({ toasts, onRemove }) {
  if (toasts.length === 0) return null
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed z-[10001] flex flex-col gap-2 pointer-events-none"
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
      className="toast-in flex items-center gap-3 px-4 py-3 rounded-[3px] pointer-events-auto"
      style={{ background: v.bg, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
    >
      <span className="font-display text-white text-sm font-bold shrink-0">{v.icon}</span>
      <p className="flex-1 font-body text-white text-[13px] m-0 leading-tight">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Chiudi notifica"
        className="text-white/60 hover:text-white bg-transparent border-none cursor-pointer p-0 flex items-center justify-center shrink-0"
      >
        <IconClose size={11} />
      </button>
    </div>
  )
}
