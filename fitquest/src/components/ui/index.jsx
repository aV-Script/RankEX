import { useEffect } from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ className = '', children }) {
  return (
    <div className={`bg-white/[.03] border border-white/[.07] rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <div className="font-display text-[10px] text-white/30 tracking-[3px] uppercase mb-3.5">
      {children}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
// size: 'default' (420px) | 'lg' (720px) | 'xl' (960px)
const MODAL_WIDTHS = {
  default: 'w-[420px]',
  lg:      'w-[420px] lg:w-[720px]',
  xl:      'w-[420px] lg:w-[960px]',
}

export function Modal({ title, onClose, size = 'default', children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-start lg:items-center justify-center overflow-y-auto py-4 px-4"
      onClick={onClose}
    >
      <div
        className={`bg-gray-900 border border-white/10 rounded-2xl p-6 lg:p-8 ${MODAL_WIDTHS[size]} max-w-[96vw] my-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-white text-base m-0">{title}</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-white/40 text-xl cursor-pointer leading-none hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ className = '', ...props }) {
  return <input className={`input-base ${className}`} {...props} />
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`input-base resize-y min-h-[60px] ${className}`}
      {...props}
    />
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
const VARIANT_CLASSES = {
  primary: 'bg-gradient-to-br from-blue-500 to-violet-500 border-0',
  danger:  'bg-gradient-to-br from-amber-500 to-red-500 border-0',
  ghost:   'bg-transparent border border-white/10',
}

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...props }) {
  return (
    <button
      disabled={loading || disabled}
      className={`
        rounded-xl py-3.5 px-4 text-white font-display text-[13px] font-bold tracking-wider
        cursor-pointer transition-opacity duration-200
        ${loading || disabled ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? 'ATTENDERE...' : children}
    </button>
  )
}

// ─── XPBar ────────────────────────────────────────────────────────────────────
export function XPBar({ xp, xpNext, color }) {
  const pct = Math.min(100, Math.round(((xp ?? 0) / (xpNext ?? 1)) * 100))

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[11px] text-white/50 mb-1 font-body">
        <span>XP {xp?.toLocaleString('it-IT')}</span>
        <span>{xpNext?.toLocaleString('it-IT')}</span>
      </div>
      <div className="bg-white/[.08] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #fff8)` }}
        />
      </div>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ color, children }) {
  return (
    <span
      className="rounded-full px-3 py-0.5 text-[11px] font-display"
      style={{ background: color + '22', color }}
    >
      {children}
    </span>
  )
}
