// Hub screen: pentagono di navigazione con avatar al centro

import { useState, useEffect } from 'react'
import { SoccerAvatar }        from './avatar/SoccerAvatar'
import { BadgeMedal }          from '../../../components/ui/BadgeMedal'
import { BADGES }              from '../../../config/badges.config'

// ── Icone sezioni ─────────────────────────────────────────────────────────────

export const ICON_TEST = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
export const ICON_TROFEI = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
export const ICON_CALENDARIO = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
export const ICON_SCHEDA = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="6" y1="20" x2="18" y2="20"/>
  </svg>
)
export const ICON_PROFILO = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

// ── Sezioni pentagono ─────────────────────────────────────────────────────────
// Vertici in senso orario dal top:
//   0 = top        → Test
//   1 = top-right  → Trofei
//   2 = bot-right  → Calendario
//   3 = bot-left   → Scheda
//   4 = top-left   → Profilo

export const PENTAGON_SECTIONS = [
  { id: 'test',       label: 'Test',       icon: ICON_TEST },
  { id: 'trofei',     label: 'Trofei',     icon: ICON_TROFEI },
  { id: 'calendario', label: 'Calendario', icon: ICON_CALENDARIO },
  { id: 'scheda',     label: 'Scheda',     icon: ICON_SCHEDA },
  { id: 'profilo',    label: 'Profilo',    icon: ICON_PROFILO },
]

// ── Geometria ─────────────────────────────────────────────────────────────────

function pentagonVerts(R) {
  return Array.from({ length: 5 }, (_, i) => {
    const rad = (90 - i * 72) * Math.PI / 180
    return { x: Math.cos(rad) * R, y: -Math.sin(rad) * R }
  })
}

// ── Badge showcase per pentagono ─────────────────────────────────────────────

function getShowcaseBadges(badges, showcase) {
  if (showcase.length > 0) {
    return showcase.filter(id => badges[id] && BADGES.find(b => b.id === id))
  }
  return Object.entries(badges)
    .sort(([, a], [, b]) => (b.awardedAt ?? 0) - (a.awardedAt ?? 0))
    .slice(0, 5).map(([id]) => id)
    .filter(id => BADGES.find(b => b.id === id))
}

// ── ClientHub ─────────────────────────────────────────────────────────────────

export function ClientHub({ client, color, rankObj, onTabChange }) {
  const [vpW,        setVpW]        = useState(() => window.innerWidth)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  useEffect(() => {
    const fn = () => setVpW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const mobile     = vpW < 1024
  const R          = mobile ? 112 : 178      // raggio pentagono
  const avatarSize = mobile ? 116 : 148      // diametro avatar
  const btnSize    = mobile ? 46  : 52       // diametro nodo vertice
  const padding    = btnSize + 28            // spazio extra ai bordi

  const W  = (R + padding) * 2
  const H  = (R + padding) * 2
  const CX = W / 2
  const CY = H / 2

  const verts = pentagonVerts(R)
  const av    = client.avatar ?? {}

  // XP progress — 5 segmenti con gap attorno a ogni icona vertice
  const xp        = client.xp    ?? 0
  const xpNext    = client.xpNext ?? 500
  const xpPct     = Math.min(xp / Math.max(xpNext, 1), 1)
  const badgeSize = mobile ? 28 : 34
  const GAP       = btnSize / 2 + 5
  const segs      = verts.map((v, i) => {
    const vn  = verts[(i + 1) % 5]
    const dx  = vn.x - v.x, dy = vn.y - v.y
    const len = Math.hypot(dx, dy)
    const ux  = dx / len, uy = dy / len
    return {
      x1: CX + v.x  + ux * GAP, y1: CY + v.y  + uy * GAP,
      x2: CX + vn.x - ux * GAP, y2: CY + vn.y - uy * GAP,
    }
  })
  const segLen     = Math.hypot(segs[0].x2 - segs[0].x1, segs[0].y2 - segs[0].y1)
  const gappedPath = segs.map(s => `M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`).join(' ')
  const pentScale  = Math.min(1, (vpW * 0.94) / W)
  const midDots     = verts.map((v, i) => {
    const vn = verts[(i + 1) % 5]
    return {
      x: CX + (v.x + vn.x) / 2,
      y: CY + (v.y + vn.y) / 2,
      segFill: Math.min(1, Math.max(0, xpPct * 5 - i)),
    }
  })

  // Badge showcase — posizionati sui midpoint del perimetro
  const showcaseBadges = getShowcaseBadges(client.badges ?? {}, client.badgeShowcase ?? [])

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center select-none"
      style={{ minHeight: 'calc(100svh - 64px)', paddingBottom: 64, gap: mobile ? 12 : 20 }}
    >
      {/* Nome + rank + livello */}
      <div className="text-center px-4">
        <div
          className="font-display font-black uppercase text-white leading-tight"
          style={{ fontSize: mobile ? 16 : 20, letterSpacing: '0.06em', textShadow: '0 0 28px var(--rx-green-glow)' }}
        >
          {client.name}
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
          {rankObj && (
            <div className="inline-flex items-center px-3 py-1 rounded-[3px] font-display font-black"
              style={{ fontSize: 12, background: color + '1e', color, border: `1px solid ${color}40` }}>
              {rankObj.label}
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] font-display font-black"
            style={{ fontSize: 11, background: color + '12', color: color + 'bb', border: `1px solid ${color}28` }}>
            <span>LV.{client.level ?? 1}</span>
            <span style={{ color: color + '40' }}>·</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.5px' }}>{xp} / {xpNext} XP</span>
          </div>
        </div>
      </div>

      {/* Pentagono — outer div scala il layout, inner div mantiene le coordinate W×H */}
      <div style={{ position: 'relative', width: W * pentScale, height: H * pentScale, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, transformOrigin: 'top left', transform: `scale(${pentScale})` }}>

        {/* SVG — XP ring sul perimetro del pentagono */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Track — 5 segmenti distaccati dai nodi */}
          <path d={gappedPath} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />
          {/* Progress — per-segment: dasharray individuale per evitare il reset dei subpath */}
          {segs.map((seg, i) => {
            const segFill = Math.min(1, Math.max(0, xpPct * 5 - i))
            const d    = `M ${seg.x1} ${seg.y1} L ${seg.x2} ${seg.y2}`
            const dOff = (1 - segFill) * segLen
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={color} strokeOpacity="0.22" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={segLen} strokeDashoffset={dOff}
                  style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)' }} />
                <path d={d} fill="none" stroke={color} strokeOpacity="0.88" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={segLen} strokeDashoffset={dOff}
                  style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)' }} />
              </g>
            )
          })}
          {/* Glow rings ai midpoint — retroilluminano i badge */}
          {midDots.map(({ x, y, segFill }, i) => (
            <circle key={i} cx={x} cy={y} r={badgeSize / 2 + 2}
              fill="none"
              stroke={color}
              strokeOpacity={showcaseBadges[i] ? (segFill >= 0.5 ? 0.45 : 0.15) : 0}
              strokeWidth="1"
              style={{ transition: 'stroke-opacity 400ms ease' }} />
          ))}
          {/* Mask circles — coprono la linea XP sotto ogni badge */}
          {midDots.map(({ x, y }, i) => showcaseBadges[i] ? (
            <circle key={`mask-${i}`} cx={x} cy={y} r={badgeSize / 2}
              style={{ fill: 'var(--bg-base)' }} />
          ) : null)}
        </svg>

        {/* Badge showcase — sui midpoint del perimetro */}
        {midDots.map(({ x, y }, i) => {
          const badgeId = showcaseBadges[i]
          if (!badgeId) return null
          return (
            <div key={badgeId} style={{
              position: 'absolute', zIndex: 3,
              left: x - badgeSize / 2,
              top:  y - badgeSize / 2,
              width: badgeSize, height: badgeSize,
              pointerEvents: 'none',
            }}>
              <BadgeMedal badgeId={badgeId} unlocked size={badgeSize} />
            </div>
          )
        })}

        {/* Nodi vertice */}
        {PENTAGON_SECTIONS.map((sec, i) => {
          const v         = verts[i]
          const half      = btnSize / 2
          const lx        = CX + v.x - half - 20
          const ly        = CY + v.y - half - 18
          const isHovered = hoveredIdx === i

          const labelBelow = v.y >= 0
          const labelStyle = labelBelow
            ? { top: btnSize + 4, left: '50%', transform: 'translateX(-50%)' }
            : { bottom: btnSize + 4, left: '50%', transform: 'translateX(-50%)' }

          return (
            <button
              key={sec.id}
              onClick={() => onTabChange(sec.id)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                position: 'absolute', zIndex: 2,
                left: lx, top: ly,
                width: btnSize + 40, height: btnSize + 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: 'none', border: 'none',
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: btnSize, height: btnSize,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isHovered
                      ? 'color-mix(in srgb, var(--rx-green) 10%, transparent)'
                      : 'color-mix(in srgb, var(--rx-card-bg) 65%, transparent)',
                    border: `1px solid ${isHovered
                      ? 'color-mix(in srgb, var(--rx-green) 50%, transparent)'
                      : 'color-mix(in srgb, var(--rx-green) 16%, transparent)'}`,
                    boxShadow: isHovered
                      ? '0 4px 18px rgba(0,0,0,0.4), 0 0 12px var(--rx-green-glow)'
                      : '0 4px 12px rgba(0,0,0,0.35)',
                    color: isHovered
                      ? 'color-mix(in srgb, var(--rx-green) 80%, transparent)'
                      : 'color-mix(in srgb, var(--rx-green) 38%, transparent)',
                    transition: 'all 200ms ease',
                  }}
                >
                  {sec.icon}
                </div>
                {/* Etichetta */}
                <span className="font-display" style={{
                  position: 'absolute',
                  ...labelStyle,
                  whiteSpace: 'nowrap',
                  fontWeight: 700,
                  fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'color 200ms ease',
                  pointerEvents: 'none',
                }}>
                  {mobile ? sec.label.slice(0, 3) : sec.label}
                </span>
              </div>
            </button>
          )
        })}

        {/* Avatar centrale */}
        <div style={{
          position: 'absolute',
          left: CX - avatarSize / 2,
          top:  CY - avatarSize / 2,
          pointerEvents: 'none',
        }}>
          <SoccerAvatar
            color={color}
            width={avatarSize} height={avatarSize}
            skinTone={av.skinTone}
            hairColor={av.hairColor}
            hairStyle={av.hairStyle}
            expression={av.expression}
            accessory={av.accessory}
            clothing={av.clothing}
            jerseyColor={av.jerseyColor}
            facialHair={av.facialHair}
            facialHairColor={av.facialHairColor}
            clothingGraphic={av.clothingGraphic}
            hatColor={av.hatColor}
            accessoriesColor={av.accessoriesColor}
            number={av.number}
          />
        </div>
      </div>{/* inner scaled */}
      </div>{/* outer layout */}

    </div>
  )
}
