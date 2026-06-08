import { BADGES_MAP, BADGE_TIERS } from '../../config/badges.config'

// ── SVG icons map ─────────────────────────────────────────────────────────────

const ICONS = {
  lightning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  clipboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  flame: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  arrow_up: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/>
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  crown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  medal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="16" r="6"/><path d="M12 10V2"/><path d="M9 5l3 5 3-5"/>
    </svg>
  ),
}

// ── Keyframe unlock ───────────────────────────────────────────────────────────

let injected = false
function injectKeyframe() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const s = document.createElement('style')
  s.textContent = `@keyframes badge-unlock { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.18)} 100%{transform:scale(1);opacity:1} }`
  document.head.appendChild(s)
}

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * BadgeMedal — cerchio con bordo colorato (tier) e icona SVG al centro.
 *
 * Props:
 *   badgeId   — ID badge (da BADGES_MAP)
 *   unlocked  — bool
 *   size      — px (default 64)
 *   animate   — bool: animazione unlock
 *   showLabel — bool: label sotto
 */
export function BadgeMedal({ badgeId, unlocked, size = 64, animate = false, showLabel = false }) {
  injectKeyframe()

  const badge = BADGES_MAP[badgeId]
  if (!badge) return null

  const tier      = BADGE_TIERS[badge.tier]
  const borderW   = size > 56 ? 3 : 2
  const iconScale = size / 64

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        title={unlocked ? badge.label : `${badge.label} — non sbloccato`}
        style={{
          width:          size,
          height:         size,
          borderRadius:   '50%',
          background:     unlocked
            ? `radial-gradient(circle at 35% 35%, ${tier.color}22, rgba(0,0,0,0.55))`
            : 'rgba(255,255,255,0.04)',
          border:         `${borderW}px solid ${unlocked ? tier.color : 'rgba(255,255,255,0.09)'}`,
          boxShadow:      unlocked ? `0 0 ${Math.round(size / 2.5)}px ${tier.glow}` : 'none',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          filter:         unlocked ? 'none' : 'grayscale(1)',
          opacity:        unlocked ? 1 : 0.28,
          animation:      animate  ? 'badge-unlock 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
          flexShrink:     0,
          transition:     'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        <span style={{
          color:   unlocked ? tier.color : 'rgba(255,255,255,0.25)',
          display: 'flex',
          transform: `scale(${iconScale})`,
        }}>
          {ICONS[badge.icon] ?? ICONS.star}
        </span>
      </div>

      {showLabel && (
        <div className="font-display" style={{
          fontWeight:    700,
          fontSize:      8,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textAlign:     'center',
          color:         unlocked ? tier.color : 'rgba(255,255,255,0.18)',
          maxWidth:      size + 16,
          lineHeight:    1.3,
        }}>
          {badge.label}
        </div>
      )}
    </div>
  )
}
