export const WEEK_DAYS = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' }, { value: 4, label: 'Gio' },
  { value: 5, label: 'Ven' }, { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

export const STATUS_INFO = {
  active:    { label: 'ATTIVA',     color: 'var(--rx-accent)' },
  cancelled: { label: 'CANCELLATA', color: '#f87171' },
  ended:     { label: 'TERMINATA',  color: '#6b7280' },
}

export const sectionStyle = {
  background:   'rgba(255,255,255,0.02)',
  border:       '1px solid rgba(255,255,255,0.06)',
  borderRadius: '4px',
}

export function dayLabels(days) {
  return WEEK_DAYS.filter(d => days.includes(d.value)).map(d => d.label).join(' · ')
}

export function dateFmt(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export function weeksBetween(start, end) {
  if (!start || !end) return null
  const ms = new Date(end) - new Date(start)
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000))
}

export function InfoChip({ label, children }) {
  return (
    <div>
      <div className="font-display text-[10px] font-semibold tracking-[2px] text-white/60 mb-1">{label}</div>
      <div className="font-display font-bold text-[12px] text-white/80">{children}</div>
    </div>
  )
}

export function EditBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-[10px] text-white/30 cursor-pointer hover:text-white/60 bg-transparent border-none transition-colors"
    >
      MODIFICA
    </button>
  )
}

export function WarningNote({ text }) {
  return (
    <p className="font-body text-[11px] m-0" style={{ color: 'rgba(251,191,36,0.7)' }}>
      ⚠ {text}
    </p>
  )
}

export function ActionRow({ onCancel, onSave, saving, saveLabel = 'SALVA', saveDisabled = false }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCancel}
        className="flex-1 py-2 font-display text-[11px] cursor-pointer bg-transparent text-white/40"
        style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        ANNULLA
      </button>
      <button
        onClick={onSave}
        disabled={saving || saveDisabled}
        className="flex-1 py-2 font-display text-[11px] cursor-pointer border-0 disabled:opacity-40 transition-opacity hover:opacity-85"
        style={{ background: 'color-mix(in srgb, var(--rx-accent) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-accent) 35%, transparent)', borderRadius: '3px', color: 'var(--rx-accent)', fontWeight: 700 }}
      >
        {saving ? 'ATTENDERE...' : saveLabel}
      </button>
    </div>
  )
}
