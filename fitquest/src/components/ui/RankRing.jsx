import { useEffect, useRef } from 'react'

/**
 * RankRing — cerchio SVG animato con il rank al centro.
 * L'arco esterno rappresenta la percentuale XP verso il prossimo livello.
 *
 * Props:
 *   rankObj  — { label, color }
 *   xp       — XP correnti
 *   xpNext   — XP necessari al prossimo livello
 *   size     — diametro in px (default 140)
 *   animated — abilita l'animazione al mount (default true)
 */
export function RankRing({ rankObj, xp = 0, xpNext = 700, size = 140, animated = true }) {
  const arcRef  = useRef(null)
  const color   = rankObj?.color ?? '#6b7280'
  const label   = rankObj?.label ?? 'F'

  const radius       = (size / 2) - 10
  const circumference = 2 * Math.PI * radius
  const pct          = xpNext > 0 ? Math.min(xp / xpNext, 1) : 0
  const targetDash   = circumference * pct

  // Animazione stroke-dashoffset al mount o al cambio rank
  useEffect(() => {
    const el = arcRef.current
    if (!el) return
    if (!animated) {
      el.style.strokeDashoffset = circumference - targetDash
      return
    }
    // Parte da 0 (nessun arco) e arriva al valore reale
    el.style.transition = 'none'
    el.style.strokeDashoffset = circumference
    // Forza il reflow prima di applicare la transizione
    void el.getBoundingClientRect()
    el.style.transition = `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)`
    el.style.strokeDashoffset = circumference - targetDash
  }, [label, circumference, targetDash, animated])

  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Cerchio di sfondo */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color + '1a'}
          strokeWidth={6}
        />
        {/* Arco XP animato */}
        <circle
          ref={arcRef}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>

      {/* Rank label al centro — fuori dall'SVG per non ruotare */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2,
      }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 900,
          fontSize: size * 0.22,
          color,
          lineHeight: 1,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: size * 0.1,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.15em',
          lineHeight: 1,
        }}>
          RANK
        </span>
      </div>
    </div>
  )
}
