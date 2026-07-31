// Pentagon.jsx
import { memo, useMemo } from 'react'
import { computeRadarAngles, computeRadarOuterPoints, buildRadarPolygon } from '../../utils/groupAnalysis'

// `multi` (array [{ id, stats, color }]) attiva la modalità overlay usata dal
// confronto di gruppo (ex componente separato PentagonMulti in
// GroupComparison.jsx) — stesso radar, N aree sovrapposte invece di una sola,
// più i raggi dal centro. Consolidato per evitare due implementazioni che
// divergevano su raggio/label/tecnica di riempimento; la geometria pura
// (angoli/punti) resta in utils/groupAnalysis.js, condivisa da entrambe le
// modalità invece di essere ridichiarata qui.
export const Pentagon = memo(function Pentagon({
  stats = {},
  statKeys = [],
  statLabels = [],
  color = 'var(--rx-accent)',
  size = 180,
  fluid = false,
  gridColor  = 'rgba(255,255,255,0.06)',
  labelColor = 'rgba(255,255,255,0.5)',
  multi = null,
}) {
  const isMulti = Array.isArray(multi)
  const cx = size / 2
  const cy = size / 2
  const R  = size * (isMulti ? 0.38 : 0.42)

  const angles = useMemo(() => computeRadarAngles(statKeys.length), [statKeys.length])

  const outerPoints = useMemo(
    () => computeRadarOuterPoints(cx, cy, R, angles),
    [cx, cy, R, angles]
  )

  const statPoints = useMemo(
    () => (isMulti ? null : buildRadarPolygon(cx, cy, R, angles, statKeys, stats)),
    [cx, cy, R, angles, statKeys, stats, isMulti]
  )

  const toPath = pts =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  const vbPad  = isMulti ? 38 : 30
  const vbSize = size + vbPad * 2

  const summary = isMulti
    ? `Radar confronto: ${statLabels.join(', ')}`
    : `Radar percentili: ${statKeys.map((key, i) => `${statLabels[i] ?? key} ${Math.round(stats[key] ?? 0)}°`).join(', ')}`

  return (
    <svg
      width={fluid || isMulti ? '100%' : size}
      height={fluid || isMulti ? '100%' : size}
      viewBox={`${-vbPad} ${-vbPad} ${vbSize} ${vbSize}`}
      style={fluid || isMulti ? { display: 'block' } : undefined}
      role="img"
      aria-label={summary}
    >
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f}
          points={outerPoints.map(p =>
            `${(cx + (p.x - cx) * f).toFixed(1)},${(cy + (p.y - cy) * f).toFixed(1)}`
          ).join(' ')}
          fill="none"
          stroke={gridColor}
          strokeWidth="1"
        />
      ))}

      {/* Raggi dal centro — solo overlay multi-atleta */}
      {isMulti && outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={gridColor} strokeWidth="1" />
      ))}

      {isMulti ? (
        [...multi].reverse().map((entry, revIdx) => {
          const i   = multi.length - 1 - revIdx
          const pts = buildRadarPolygon(cx, cy, R, angles, statKeys, entry.stats)
          return (
            <g key={entry.id ?? i}>
              <path d={toPath(pts)} fill={`color-mix(in srgb, ${entry.color} 13%, transparent)`} stroke={entry.color} strokeWidth="2" strokeLinejoin="round" />
              {pts.map((p, pi) => <circle key={pi} cx={p.x} cy={p.y} r="3.5" fill={entry.color} />)}
            </g>
          )
        })
      ) : (
        <>
          {/* Stat area */}
          <path d={toPath(statPoints)} fill={color} fillOpacity={0.2} stroke={color} strokeWidth="2" strokeLinejoin="round" />
          {/* Dots */}
          {statPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />)}
        </>
      )}

      {/* Labels */}
      {statLabels.map((label, i) => {
        const offset = isMulti ? 28 : (size < 140 ? 18 : 24)
        const lx = cx + (R + offset) * Math.cos(angles[i])
        const ly = cy + (R + offset) * Math.sin(angles[i])
        return (
          <text key={i} x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isMulti ? 10 : (size > 160 ? 10 : 9)}
            fill={labelColor}
            fontFamily="Montserrat"
            fontWeight="600"
            letterSpacing="1"
          >
            {isMulti ? label : label.slice(0, 3)}
          </text>
        )
      })}
    </svg>
  )
})
