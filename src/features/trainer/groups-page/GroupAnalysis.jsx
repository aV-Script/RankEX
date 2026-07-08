import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  heatColor, buildHeatmap, buildGroupSummary,
  buildTrendStatOptions, buildTrendChartData,
} from '../../../utils/groupAnalysis'

export function GroupAnalysis({ clients }) {

  // ── Heatmap ─────────────────────────────────────────────────────────────────
  const { statCols, heatRows, averageRow } = useMemo(() => buildHeatmap(clients), [clients])

  // ── Riepilogo ────────────────────────────────────────────────────────────────
  const summary = useMemo(() => buildGroupSummary(clients), [clients])

  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-body text-white/20 text-[14px]">Nessun atleta nel gruppo.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Riga 1 — Riepilogo gruppo (full width) */}
      <div className="rounded-[4px] p-5 rx-card">
        <div className="font-display text-[11px] font-semibold tracking-[2px] uppercase mb-5" style={{ color: 'var(--rx-green)' }}>◈ Riepilogo gruppo</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <StatTile label="ATLETI"      value={clients.length}             />
          {summary.avgLevel    != null && <StatTile label="LV. MEDIO"     value={`Lv.${summary.avgLevel}`}     />}
          {summary.topRankLabel         && <StatTile label="RANK COMUNE"  value={summary.topRankLabel}         gold />}
          {summary.best                 && <StatTile label="STAT FORTE"   value={summary.best.label}   sub={`${Math.round(summary.best.mean)}°`}  positive />}
          {summary.worst                && <StatTile label="STAT DEBOLE"  value={summary.worst.label}  sub={`${Math.round(summary.worst.mean)}°`} negative />}
        </div>
      </div>

      {/* Riga 2 — Andamento nel tempo (full width) */}
      <GroupTrendChart clients={clients} />

      {/* Riga 3 — Heatmap full width */}
      <div className="rounded-[4px] p-5 rx-card">
          <div className="font-display text-[11px] font-semibold tracking-[2px] uppercase mb-5" style={{ color: 'var(--rx-green)' }}>◈ Heatmap gruppo</div>
          {statCols.length > 0 ? (
            <div
              className="rounded-[3px] p-4 overflow-x-auto"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: statCols.length * 72 + 140 }}>
                <thead>
                  <tr>
                    <th className="text-left pb-3 pr-3" style={{ minWidth: 130 }}>
                      <span className="font-display text-[10px] font-semibold tracking-[1px] text-white/25">ATLETA</span>
                    </th>
                    {statCols.map(col => (
                      <th key={col.key} className="pb-3 px-1 text-center" style={{ minWidth: 64 }}>
                        <span className="font-display text-[10px] font-semibold tracking-[1px] text-white/25 uppercase">{col.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatRows.map(({ client, vals }) => (
                    <tr key={client.id}>
                      <td className="pr-3 py-1" style={{ minWidth: 130 }}>
                        <span className="font-display font-bold text-[12px] text-white/75 truncate block max-w-[120px]">{client.name}</span>
                      </td>
                      {vals.map((val, ci) => {
                        const { bg, text } = heatColor(val)
                        return (
                          <td key={ci} className="px-1 py-1 text-center">
                            <div
                              className="rounded-[3px] font-display font-black text-[12px] leading-none py-1.5"
                              style={{ background: bg, color: text, minWidth: 48 }}
                            >
                              {val != null ? Math.round(val) : '—'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="pr-3 pt-4">
                      <span className="font-display text-[10px] font-semibold tracking-[1.5px] text-white/30">MEDIA</span>
                    </td>
                    {averageRow.map((val, ci) => {
                      const { bg, text } = heatColor(val)
                      return (
                        <td key={ci} className="px-1 pt-4 text-center">
                          <div
                            className="rounded-[3px] font-display font-black text-[12px] leading-none py-1.5"
                            style={{
                              background: val != null ? bg : 'transparent',
                              color: val != null ? text : 'rgba(255,255,255,0.15)',
                              border: val != null ? `1px solid ${text}33` : 'none',
                              minWidth: 48,
                            }}
                          >
                            {val != null ? val : '—'}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="font-body text-[13px] text-white/20">Nessun campionamento registrato.</p>
          )}
      </div>

    </div>
  )
}

// ── Componenti locali ──────────────────────────────────────────────────────────

const STAT_TILE_VARIANTS = {
  gold:     { color: '#ffd700',               bg: 'rgba(255,215,0,0.06)',      bd: 'rgba(255,215,0,0.18)'      },
  positive: { color: 'var(--rx-green)',               bg: 'color-mix(in srgb, var(--rx-green) 6%, transparent)',      bd: 'color-mix(in srgb, var(--rx-green) 18%, transparent)'      },
  negative: { color: '#f87171',               bg: 'rgba(248,113,113,0.06)',    bd: 'rgba(248,113,113,0.18)'    },
  default:  { color: 'rgba(255,255,255,0.75)', bg: 'rgba(255,255,255,0.03)',   bd: 'rgba(255,255,255,0.06)'    },
}

function StatTile({ label, value, sub, gold, positive, negative }) {
  const variant = gold ? 'gold' : positive ? 'positive' : negative ? 'negative' : 'default'
  const { color, bg, bd } = STAT_TILE_VARIANTS[variant]

  return (
    <div className="px-3 py-3 rounded-[3px] flex flex-col gap-1.5" style={{ background: bg, border: `1px solid ${bd}` }}>
      <span className="font-display text-[10px] font-semibold tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</span>
      <span className="font-display font-black text-[15px] leading-tight truncate" style={{ color }}>{value}</span>
      {sub && <span className="font-display text-[11px]" style={{ color: color + 'aa' }}>{sub}</span>}
    </div>
  )
}

function GroupTrendChart({ clients }) {
  const [selected, setSelected] = useState('media')

  const statOptions = useMemo(() => buildTrendStatOptions(clients), [clients])

  const chartData = useMemo(() => buildTrendChartData(clients, selected), [clients, selected])

  const hasData = chartData.length >= 2

  return (
    <div className="rounded-[4px] p-5 rx-card">
      <div className="font-display text-[11px] font-semibold tracking-[2px] uppercase mb-4" style={{ color: 'var(--rx-green)' }}>◈ Andamento nel tempo</div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {statOptions.map(opt => (
          <TrendPill key={opt.key} active={selected === opt.key} onClick={() => setSelected(opt.key)}>
            {opt.label}
          </TrendPill>
        ))}
      </div>

      {!hasData ? (
        <p className="font-body text-[13px] text-white/20 text-center py-4">
          Servono almeno 2 campionamenti con questa metrica per visualizzare il trend.
        </p>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10, fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10, fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}°`}
              />
              <Tooltip
                formatter={(v, _name, { payload }) => [
                  `${v}° · ${payload?.n ?? 1} atleti`,
                  statOptions.find(o => o.key === selected)?.label ?? selected,
                ]}
                contentStyle={{
                  background:   'var(--rx-surface)',
                  border:       '1px solid var(--rx-border)',
                  borderRadius: 4,
                  fontFamily:   'Inter',
                  fontSize:     12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}
                itemStyle={{ color: 'var(--rx-green)', fontWeight: 400 }}
              />
              <Line
                type="monotone"
                dataKey="valore"
                stroke="var(--rx-green)"
                strokeWidth={2}
                dot={{ fill: 'var(--rx-green)', r: 3 }}
                activeDot={{ fill: 'var(--rx-green)', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function TrendPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-[3px] font-display text-[11px] border cursor-pointer transition-all"
      style={active
        ? { background: 'color-mix(in srgb, var(--rx-green) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--rx-green) 35%, transparent)', color: 'var(--rx-green)' }
        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.28)' }
      }
    >
      {children}
    </button>
  )
}
