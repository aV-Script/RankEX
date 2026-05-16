// Hub screen — avatar al centro, nav items radialmente intorno (desktop)
// Mobile: solo avatar, navigazione via ruota

import { SoccerAvatar } from './avatar/SoccerAvatar'

const RADIUS = 190  // distanza dal centro ai nav item (desktop)

export function ClientHub({ client, color, rankObj, tabs, onTabChange }) {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ minHeight: 'calc(100svh - 80px)' }}
    >
      {/* ── Mobile: avatar centrato ───────────────────────────── */}
      <div className="lg:hidden flex flex-col items-center gap-2">
        <HubAvatar client={client} color={color} rankObj={rankObj} />
        <p className="font-display text-[9px] tracking-[3px] text-white/20 uppercase mt-4">
          Tocca ◎ per navigare
        </p>
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
              {/* Cerchio */}
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
              {/* Label sotto */}
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

// ── Avatar card dell'hub ───────────────────────────────────────────────────────
// Il frame è il mount point per il layer 3D (React Three Fiber).
// Per ora: SoccerAvatar SVG illustrato. Swap futuro: sostituire il contenuto del frame.

function HubAvatar({ client, color, rankObj }) {
  const av = client.avatar ?? {}
  return (
    <div style={{ width: 160 }}>
      {/* Mount point avatar — nessun frame visibile */}
      <SoccerAvatar
        color={color}
        skinTone={av.skinTone}
        hairColor={av.hairColor}
        hairStyle={av.hairStyle}
        expression={av.expression}
        pose={av.pose}
        width="160"
      />

      {/* Nome + rank + livello */}
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
            style={{
              fontSize:   10,
              background: color + '1e',
              color,
              border:     `1px solid ${color}40`,
              boxShadow:  `0 0 8px ${color}18`,
            }}
          >
            {rankObj?.label ?? '?'}
          </div>
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-[3px] font-display font-black"
            style={{
              fontSize:   9,
              background: 'rgba(255,255,255,0.05)',
              color:      'rgba(255,255,255,0.35)',
              border:     '1px solid rgba(255,255,255,0.10)',
            }}
          >
            LV.{client.level}
          </div>
        </div>
      </div>
    </div>
  )
}
