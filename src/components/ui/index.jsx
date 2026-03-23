import { useEffect }      from 'react'
import { Pentagon }       from './Pentagon'
import { getStatsConfig } from '../../constants'

export { XPBar } from './XPBar'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ className = '', children }) {
  return (
    <div className={`bg-white/[.03] border border-white/[.07] rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children, className = '' }) {
  return (
    <div className={`font-display text-[10px] text-white/30 tracking-[3px] uppercase mb-3.5 ${className}`}>
      {children}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
const MODAL_WIDTHS = {
  default: 'w-[420px]',
  lg:      'w-[420px] lg:w-[720px]',
  xl:      'w-[420px] lg:w-[960px]',
}

export function Modal({ title, onClose, disableOverlayClose, size = 'default', children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-start lg:items-center justify-center overflow-y-auto py-4 px-4"
      onClick={disableOverlayClose ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-gray-900 border border-white/10 rounded-2xl p-6 lg:p-8 ${MODAL_WIDTHS[size]} max-w-[96vw] my-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="modal-title" className="font-display text-white text-base m-0">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
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

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ color }) {
  return (
    <div className="px-6">
      <div
        className="w-full h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}33, transparent)` }}
      />
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, error, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-white/40 text-[11px] font-display tracking-wider mb-1.5 block"
      >
        {label.toUpperCase()}
      </label>
      {children}
      {error && (
        <p role="alert" className="m-0 mt-1 text-red-400 font-body text-[12px]">{error}</p>
      )}
    </div>
  )
}

// ─── ActivityLog ──────────────────────────────────────────────────────────────
export function ActivityLog({ log = [], color }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <SectionLabel>◈ Attività recenti</SectionLabel>
      {log.length === 0 && (
        <p className="m-0 font-body text-[13px] text-white/20">Nessuna attività ancora.</p>
      )}
      {log.slice(0, 5).map((entry, i) => (
        <div key={i} className="flex gap-2.5 items-start mb-2.5">
          <div className="flex flex-col items-center pt-1.5 gap-1">
            <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: color + '88' }} />
            {i < Math.min(log.length, 5) - 1 && (
              <div className="w-px flex-1 min-h-[12px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
            )}
          </div>
          <div className="flex-1 pb-1">
            <div className="font-body text-[13px] text-white/70">{entry.action}</div>
            <div className="flex gap-2 mt-0.5">
              <span className="font-body text-[11px] text-white/20">{entry.date}</span>
              {entry.xp > 0 && (
                <span className="font-display text-[10px] text-emerald-400">+{entry.xp} XP</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── StatsSection ─────────────────────────────────────────────────────────────
export function StatsSection({ stats = {}, prevStats = null, categoria = 'health', color, pentagonSize = 130 }) {
  const config     = getStatsConfig(categoria)
  const statKeys   = config.map(t => t.stat)
  const statLabels = config.map(t => t.label)

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: '3fr 2fr' }}>
      {/* Barre statistiche */}
      <div className="flex flex-col justify-center gap-3">
        {statKeys.map((key, i) => {
          const val   = stats[key] ?? 0
          const prev  = prevStats?.[key] ?? null
          const delta = prev !== null ? val - prev : null

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="font-body text-[12px] text-white/50 w-20 shrink-0">
                {statLabels[i]}
              </span>
              <div
                className="flex-1 h-[5px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${val}%`, background: color }}
                />
              </div>
              <span
                className="font-display text-[12px] w-7 text-right tabular-nums"
                style={{ color }}
              >
                {val}
              </span>
              {delta !== null && (
                <span
                  className="font-display text-[10px] w-8 text-right tabular-nums"
                  style={{ color: delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}
                >
                  {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Pentagon */}
      <div className="flex items-center justify-center">
        <Pentagon
          stats={stats}
          statKeys={statKeys}
          statLabels={statLabels}
          color={color}
          size={pentagonSize}
        />
      </div>
    </div>
  )
}