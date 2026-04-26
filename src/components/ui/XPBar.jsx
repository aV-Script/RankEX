/**
 * Barra XP riusabile.
 * Usata in ClientView, DashboardHeader, CampionamentoView.
 *
 * Props:
 *   xp     — XP corrente
 *   xpNext — XP per il prossimo livello
 *   color  — colore del rank
 *   size   — 'sm' (h-1.5) | 'lg' (h-3, default)
 */
export function XPBar({ xp, xpNext, color, size = 'lg', fullWidth = false }) {
  const pct    = xpNext > 0 ? Math.round((xp / xpNext) * 100) : 0
  const height = size === 'sm' ? 'h-1.5' : 'h-3'

  return (
    <div className={`w-full ${fullWidth ? '' : 'max-w-sm'}`}>
      <div className="flex justify-between mb-1.5">
        <span className="font-display text-[11px] text-white/30 tracking-[0.2em]">EXP</span>
        <span className="font-display text-[12px] font-semibold" style={{ color }}>
          {xp.toLocaleString()} / {xpNext.toLocaleString()}
        </span>
      </div>
      <div className={`${height} rounded-full overflow-hidden`} style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-1000"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}