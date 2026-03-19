// Pentagon.jsx
import { memo, useMemo } from 'react'

export const Pentagon = memo(function Pentagon({
  stats = {},
  statKeys = [],
  statLabels = [],
  color = '#60a5fa',
  size = 180,
  fluid = false,
}) {
  const cx = size / 2
  const cy = size / 2
  const R  = size * 0.42

  const angles = statKeys.map((_, i) => (Math.PI * 2 * i) / statKeys.length - Math.PI / 2)

  const outerPoints = useMemo(
    () => angles.map(a => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) })),
    [cx, cy, R, angles.join()]
  )

  const statPoints = useMemo(
    () => statKeys.map((key, i) => {
      const val = Math.min(100, Math.max(0, stats[key] ?? 0))
      const r   = (val / 100) * R
      return { x: cx + r * Math.cos(angles[i]), y: cy + r * Math.sin(angles[i]) }
    }),
    [stats, statKeys, cx, cy, R]
  )

  const toPath = pts =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  const vbPad = 30
  const vbSize = size + vbPad * 2

  return (
    <svg
      width={fluid ? '100%' : size}
      height={fluid ? '100%' : size}
      viewBox={`${-vbPad} ${-vbPad} ${vbSize} ${vbSize}`}
      style={fluid ? { display: 'block' } : undefined}
    >
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f}
          points={outerPoints.map(p =>
            `${(cx + (p.x - cx) * f).toFixed(1)},${(cy + (p.y - cy) * f).toFixed(1)}`
          ).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Spokes */}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}

      {/* Stat area */}
      <path d={toPath(statPoints)} fill={color + '33'} stroke={color} strokeWidth="2" strokeLinejoin="round" />

      {/* Dots */}
      {statPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />)}

      {/* Labels */}
      {statLabels.map((label, i) => {
        const offset = size < 140 ? 18 : 24
        const lx = cx + (R + offset) * Math.cos(angles[i])
        const ly = cy + (R + offset) * Math.sin(angles[i])
        return (
          <text key={i} x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size > 160 ? 10 : 9}
            fill="rgba(255,255,255,0.5)"
            fontFamily="Rajdhani"
            fontWeight="600"
            letterSpacing="1"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
})