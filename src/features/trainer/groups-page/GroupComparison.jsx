import { useState, useMemo, memo } from 'react'
import { ALL_TESTS } from '../../../constants/index'

const COMPARISON_COLORS = ['#0fd65a', '#2ecfff', '#ffd700']
const MAX_SELECTED = 3

export function GroupComparison({ clients }) {
  const defaultSelected = useMemo(() => {
    const sorted = [...clients]
      .filter(c => c.media != null)
      .sort((a, b) => b.media - a.media)
    return sorted.slice(0, 2).map(c => c.id)
  }, [clients])

  const [selected, setSelected] = useState(defaultSelected)

  const selectedClients = useMemo(
    () => selected.map(id => clients.find(c => c.id === id)).filter(Boolean),
    [selected, clients]
  )

  const statCols = useMemo(() => {
    const keys = new Set()
    selectedClients.forEach(c => Object.keys(c.stats ?? {}).forEach(k => keys.add(k)))
    return Array.from(keys).map(key => ({
      key,
      label: ALL_TESTS.find(t => t.stat === key)?.label ?? key,
    }))
  }, [selectedClients])

  const handleToggle = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_SELECTED) return prev
      return [...prev, id]
    })
  }

  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-body text-white/20 text-[14px]">Nessun atleta nel gruppo.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">

      {/* ── Colonna sinistra: selettore + tabella valori ── */}
      <div className="flex flex-col gap-4 w-full lg:w-[40%]">

        {/* Selettore */}
        <div className="rounded-[4px] p-5 rx-card">
          <div className="font-display text-[11px] font-semibold tracking-[2px] uppercase mb-5" style={{ color: '#0fd65a' }}>
            ◈ Confronto atleti
          </div>
          <div
            className="rounded-[3px] p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="font-display text-[10px] font-semibold text-white/25 tracking-[1.5px] mb-3">
              SELEZIONA ATLETI (max {MAX_SELECTED})
            </div>
            <div className="flex gap-2 flex-wrap">
              {clients.map(c => {
                const selIdx   = selected.indexOf(c.id)
                const isActive = selIdx !== -1
                const color    = isActive ? COMPARISON_COLORS[selIdx] : null
                const disabled = !isActive && selected.length >= MAX_SELECTED
                return (
                  <button
                    key={c.id}
                    onClick={() => handleToggle(c.id)}
                    disabled={disabled}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] font-display font-bold text-[12px] cursor-pointer border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={isActive
                      ? { background: `${color}18`, borderColor: `${color}55`, color }
                      : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
                    }
                  >
                    {isActive && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabella valori (visibile solo se ci sono dati) */}
        {selectedClients.length > 0 && statCols.length > 0 && (
          <div className="rounded-[4px] p-5 rx-card">
            <div className="font-display text-[11px] font-semibold tracking-[2px] uppercase mb-4" style={{ color: '#0fd65a' }}>◈ Valori</div>
            {/* Legenda colori */}
            <div className="flex gap-3 flex-wrap mb-4">
              {selectedClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COMPARISON_COLORS[i] }} />
                  <span className="font-display font-bold text-[12px]" style={{ color: COMPARISON_COLORS[i] }}>{c.name}</span>
                </div>
              ))}
            </div>
            <div
              className="rounded-[3px] p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <ComparisonTable clients={selectedClients} statCols={statCols} />
            </div>
          </div>
        )}

      </div>

      {/* ── Colonna destra: pentagon ── */}
      <div className="w-full lg:w-[60%]">
        {selectedClients.length > 0 && statCols.length > 0 ? (
          <div className="rounded-[4px] p-5 rx-card flex flex-col items-center gap-5">
            <div className="w-full font-display text-[11px] font-semibold tracking-[2px] uppercase" style={{ color: '#0fd65a' }}>◈ Radar</div>
            <div style={{ width: '100%', maxWidth: 360, aspectRatio: '1 / 1' }}>
              <PentagonMulti
                clients={selectedClients}
                statKeys={statCols.map(s => s.key)}
                statLabels={statCols.map(s => s.label)}
                colors={selectedClients.map((_, i) => COMPARISON_COLORS[i])}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-[4px] p-8 rx-card flex items-center justify-center min-h-[200px]">
            <span className="font-body text-white/20 text-[13px] text-center">
              {selectedClients.length === 0
                ? 'Seleziona almeno un atleta.'
                : 'Nessun campionamento per gli atleti selezionati.'}
            </span>
          </div>
        )}
      </div>

    </div>
  )
}

// ── Pentagon multi-overlay ─────────────────────────────────────────────────────

const PentagonMulti = memo(function PentagonMulti({ clients, statKeys, statLabels, colors }) {
  const size = 300
  const cx   = size / 2
  const cy   = size / 2
  const R    = size * 0.38
  const n    = statKeys.length

  const angles      = statKeys.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2)
  const outerPoints = angles.map(a => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }))
  const toPath = pts =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  const vbPad  = 38
  const vbSize = size + vbPad * 2

  return (
    <svg width="100%" height="100%" viewBox={`${-vbPad} ${-vbPad} ${vbSize} ${vbSize}`} style={{ display: 'block' }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f}
          points={outerPoints.map(p =>
            `${(cx + (p.x - cx) * f).toFixed(1)},${(cy + (p.y - cy) * f).toFixed(1)}`
          ).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}
      {/* Spokes */}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Stat areas — first client on top */}
      {[...clients].reverse().map((client, revIdx) => {
        const i     = clients.length - 1 - revIdx
        const color = colors[i]
        const pts   = statKeys.map((key, ki) => {
          const val = Math.min(100, Math.max(0, client.stats?.[key] ?? 0))
          return { x: cx + (val / 100) * R * Math.cos(angles[ki]), y: cy + (val / 100) * R * Math.sin(angles[ki]) }
        })
        return (
          <g key={client.id}>
            <path d={toPath(pts)} fill={color + '22'} stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {pts.map((p, pi) => <circle key={pi} cx={p.x} cy={p.y} r="3.5" fill={color} />)}
          </g>
        )
      })}
      {/* Labels */}
      {statLabels.map((label, i) => {
        const lx = cx + (R + 28) * Math.cos(angles[i])
        const ly = cy + (R + 28) * Math.sin(angles[i])
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="rgba(255,255,255,0.5)" fontFamily="Montserrat" fontWeight="600" letterSpacing="1">
            {label}
          </text>
        )
      })}
    </svg>
  )
})

// ── Tabella confronto ──────────────────────────────────────────────────────────

function ComparisonTable({ clients, statCols }) {
  return (
    <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
      <thead>
        <tr>
          <th className="text-left pb-3" style={{ minWidth: 90 }}>
            <span className="font-display text-[10px] font-semibold tracking-[1px] text-white/25">STAT</span>
          </th>
          {clients.map((c, i) => (
            <th key={c.id} className="pb-3 px-2 text-right" style={{ minWidth: 60 }}>
              <span className="font-display text-[10px] font-semibold tracking-[1px]" style={{ color: COMPARISON_COLORS[i] }}>
                {c.name.split(' ')[0].toUpperCase()}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {statCols.map(col => (
          <tr key={col.key}>
            <td className="py-1.5 pr-2 border-t border-white/[.04]">
              <span className="font-display text-[10px] text-white/35">{col.label}</span>
            </td>
            {clients.map((c, i) => {
              const val   = c.stats?.[col.key]
              const isMax = val != null && clients.every(o => o.id === c.id || (o.stats?.[col.key] ?? -1) <= val)
              return (
                <td key={c.id} className="py-1.5 px-2 text-right border-t border-white/[.04]">
                  <span
                    className="font-display font-black text-[13px]"
                    style={{ color: val != null ? (isMax ? COMPARISON_COLORS[i] : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.15)' }}
                  >
                    {val != null ? `${Math.round(val)}°` : '—'}
                  </span>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
