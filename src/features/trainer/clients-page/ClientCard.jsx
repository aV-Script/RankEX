import { memo }           from 'react'
import { useClientRank }  from '../../../hooks/useClientRank'
import { getStatsConfig } from '../../../constants'
import { getCategoriaById } from '../../../constants'

/**
 * Card singolo cliente nella lista.
 * Mostra rank, livello, categoria, XP e barre statistiche con label.
 * Memoizzata — si aggiorna solo se client o onSelect cambiano.
 */
export const ClientCard = memo(function ClientCard({ client, onSelect }) {
  const { color }  = useClientRank(client)
  const config     = getStatsConfig(client.categoria)
  const xpPct      = client.xpNext > 0
    ? Math.round((client.xp / client.xpNext) * 100) : 0
  const categoria = getCategoriaById(client.categoria)
  const hasStats = client.stats &&
    Object.values(client.stats).some(v => v > 0)

  return (
    <button
      onClick={() => onSelect(client)}
      data-color={color}
      className="
        text-left w-full rounded-2xl p-4
        cursor-pointer transition-all duration-200
        flex flex-col gap-3 group
        border border-white/[.07] bg-white/[.03]
        hover:border-white/20
      "
      style={{
        '--card-color': color,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background   = color + '0d'
        e.currentTarget.style.borderColor  = color + '55'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background   = ''
        e.currentTarget.style.borderColor  = ''
      }}
    >
      {/* Header — rank + nome + categoria */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '22', border: `2px solid ${color}55` }}
        >
          <span className="font-display font-black text-[15px]" style={{ color }}>
            {client.rank ?? 'F'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-body font-bold text-[15px] text-white truncate">
            {client.name}
          </div>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-display"
              style={{ background: color + '22', color }}
            >
              LVL {client.level}
            </span>
            {client.categoria && (
              <span className="text-white/20 text-[10px] font-body border border-white/10 rounded-full px-2 py-0.5">
                {categoria.label}
              </span>
            )}
          </div>
        </div>

        <span className="text-white/20 text-[16px] group-hover:text-white/50 transition-colors">
          ›
        </span>
      </div>

      {/* XP bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-display text-[9px] text-white/20 tracking-[2px]">EXP</span>
          <span className="font-display text-[9px]" style={{ color: color + 'aa' }}>
            {xpPct}%
          </span>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden bg-white/[.06]">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${xpPct}%`, background: color }}
          />
        </div>
      </div>

      {/* Stat bars con label */}
      {hasStats && (
        <div className="flex flex-col gap-1.5">
          {config.map(({ stat, label }) => {
            const val = client.stats?.[stat] ?? 0
            return (
              <div key={stat} className="flex items-center gap-2">
                <span className="font-display text-[9px] text-white/25 w-16 shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/[.06]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${val}%`, background: color + 'cc' }}
                  />
                </div>
                <span className="font-display text-[9px] w-5 text-right" style={{ color: color + 'aa' }}>
                  {val}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </button>
  )
})