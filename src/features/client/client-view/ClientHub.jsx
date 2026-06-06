// Hub screen — avatar al centro, nav items radialmente intorno (desktop)
// Mobile: avatar grande cliccabile che apre il menu radiale

import { useEffect }    from 'react'
import { SoccerAvatar }  from './avatar/SoccerAvatar'
import { XPBar }         from '../../../components/ui/XPBar'
import { BadgeMedal }    from '../../../components/ui/BadgeMedal'
import { BADGES }        from '../../../config/badges.config'

const RADIUS = 190  // distanza dal centro ai nav item (desktop)

// Inietta il keyframe pulse una volta sola
const PULSE_CSS = `
@keyframes rx-hub-pulse {
  0%   { box-shadow: 0 0 0 0   var(--hub-glow); }
  65%  { box-shadow: 0 0 0 16px transparent; }
  100% { box-shadow: 0 0 0 0   transparent; }
}
`
let pulseInjected = false
function injectPulse() {
  if (pulseInjected) return
  pulseInjected = true
  const s = document.createElement('style')
  s.textContent = PULSE_CSS
  document.head.appendChild(s)
}

export function ClientHub({ client, color, rankObj, tabs, onTabChange, onOpenNav }) {
  useEffect(injectPulse, [])

  const av = client.avatar ?? {}

  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ minHeight: 'calc(100svh - 80px)' }}
    >
      {/* ── Mobile: avatar cliccabile + info sotto ───────────────── */}
      <div className="lg:hidden flex flex-col items-center gap-5 px-6 select-none">

        {/* Avatar — tap per aprire il nav */}
        <button
          onClick={onOpenNav}
          aria-label="Apri navigazione"
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', display: 'block',
            '--hub-glow': color + '55',
            animation: 'rx-hub-pulse 2.4s ease-out infinite',
            borderRadius: '50%',
          }}
        >
          <SoccerAvatar
            color={color}
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
            width={170}
          />
        </button>

        {/* Nome + badge rank + livello */}
        <div className="text-center">
          <div
            className="font-display font-black uppercase text-white leading-tight"
            style={{ fontSize: 17, letterSpacing: '0.06em', textShadow: `0 0 24px ${color}30` }}
          >
            {client.name}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            {rankObj && (
              <div
                className="inline-flex items-center px-2.5 py-0.5 rounded-[3px] font-display font-black"
                style={{ fontSize: 10, background: color + '1e', color, border: `1px solid ${color}40` }}
              >
                {rankObj.label}
              </div>
            )}
            <div
              className="inline-flex items-center px-2 py-0.5 rounded-[3px] font-display font-black"
              style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              LV.{client.level ?? 1}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ width: 220 }}>
          <XPBar xp={client.xp ?? 0} xpNext={client.xpNext ?? 500} color={color} fullWidth />
        </div>

        {/* Hint tap */}
        <p
          className="font-display uppercase text-center"
          style={{ fontSize: 8, letterSpacing: '2.5px', color: color + '45', marginTop: -8 }}
        >
          Tocca l'avatar per navigare
        </p>

        {/* Ultimi 3 badge earned */}
        <HubBadgeRow badges={client.badges ?? {}} color={color} />
      </div>

      {/* ── Desktop: avatar + nav radiale ─────────────────────── */}
      <div className="hidden lg:block relative" style={{ width: 540, height: 540 }}>

        {/* Anello guida + linee verso i nav item */}
        <svg className="absolute inset-0 pointer-events-none" width="540" height="540">
          <circle cx="270" cy="270" r={RADIUS} stroke={color} strokeOpacity="0.07" strokeWidth="1" fill="none" />
          {tabs.map((tab, i) => {
            const angle = (i / tabs.length) * 2 * Math.PI - Math.PI / 2
            const x = 270 + Math.cos(angle) * RADIUS
            const y = 270 + Math.sin(angle) * RADIUS
            return (
              <line
                key={tab.id}
                x1="270" y1="270" x2={x} y2={y}
                stroke={color} strokeOpacity="0.09" strokeWidth="1" strokeDasharray="5,6"
              />
            )
          })}
        </svg>

        {/* Avatar al centro */}
        <div
          className="absolute"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}
        >
          <HubAvatar client={client} color={color} rankObj={rankObj} />
        </div>

        {/* Nav item radiali — cerchi */}
        {tabs.map((tab, i) => {
          const angle = (i / tabs.length) * 2 * Math.PI - Math.PI / 2
          const x = Math.cos(angle) * RADIUS
          const y = Math.sin(angle) * RADIUS
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="absolute flex flex-col items-center gap-2 cursor-pointer group"
              style={{
                left:      `calc(50% + ${x}px)`,
                top:       `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width:      54,
                  height:     54,
                  background: 'rgba(13,21,32,0.94)',
                  border:     `1px solid ${color}30`,
                  boxShadow:  `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${color}10`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background  = color + '18'
                  e.currentTarget.style.borderColor = color + '60'
                  e.currentTarget.style.boxShadow   = `0 4px 24px rgba(0,0,0,0.5), 0 0 18px ${color}30`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background  = 'rgba(13,21,32,0.94)'
                  e.currentTarget.style.borderColor = color + '30'
                  e.currentTarget.style.boxShadow   = `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${color}10`
                }}
              >
                <span style={{ color: color + '85' }}>{tab.icon}</span>
              </div>
              <span
                className="font-display tracking-[2px] uppercase text-white/40"
                style={{ fontSize: 8 }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Badge row — ultimi 3 badge earned ────────────────────────────────────────

function HubBadgeRow({ badges, color }) {
  const earned = Object.entries(badges)
    .sort(([, a], [, b]) => (b.awardedAt ?? 0) - (a.awardedAt ?? 0))
    .slice(0, 3)
    .map(([id]) => id)
    .filter(id => BADGES.find(b => b.id === id))

  if (earned.length === 0) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-3">
      {earned.map(id => (
        <BadgeMedal key={id} badgeId={id} unlocked size={36} />
      ))}
      {earned.length > 0 && (
        <div className="font-display text-[7px] tracking-[1.5px] uppercase" style={{ color: color + '50' }}>
          {Object.keys(badges).length} trofei
        </div>
      )}
    </div>
  )
}

// ── Avatar card desktop ────────────────────────────────────────────────────────

function HubAvatar({ client, color, rankObj }) {
  const av = client.avatar ?? {}
  return (
    <div style={{ width: 160 }}>
      <SoccerAvatar
        color={color}
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
        width={160}
      />

      <div className="mt-3 text-center">
        <div
          className="font-display font-black text-[15px] text-white uppercase tracking-wide leading-tight"
          style={{ textShadow: `0 0 20px ${color}30` }}
        >
          {client.name}
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <div
            className="inline-flex items-center px-2.5 py-0.5 rounded-[3px] font-display font-black"
            style={{ fontSize: 10, background: color + '1e', color, border: `1px solid ${color}40`, boxShadow: `0 0 8px ${color}18` }}
          >
            {rankObj?.label ?? '?'}
          </div>
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-[3px] font-display font-black"
            style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            LV.{client.level}
          </div>
        </div>
      </div>
    </div>
  )
}
