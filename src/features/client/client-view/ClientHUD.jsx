import { XPBar } from '../../../components/ui/XPBar'

export function ClientHUD({ client, color, rankObj, activeTab, tabs }) {
  const tabInfo = tabs.find(t => t.id === activeTab)

  return (
    <div
      className="sticky top-0 z-30 shrink-0"
      style={{
        background:     'rgba(4,7,12,0.97)',
        backdropFilter: 'blur(16px)',
        borderBottom:   `1px solid ${color}18`,
        boxShadow:      `0 4px 24px rgba(0,0,0,0.5), 0 0 40px ${color}08`,
      }}
    >
      {/* ── Riga principale ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2.5">

        {/* Avatar compatto — placeholder pronto per layer 3D */}
        <div className="relative shrink-0" style={{ width: 54, height: 68 }}>
          <div
            className="relative overflow-hidden rounded-[3px] w-full h-full"
            style={{
              background: `linear-gradient(170deg, ${color}14 0%, rgba(4,7,12,0.9) 100%)`,
              border:     `1px solid ${color}35`,
              boxShadow:  `0 0 18px ${color}18`,
            }}
          >
            {/* Texture hex */}
            <div className="absolute inset-0 bg-hex" style={{ opacity: 0.18 }} />

            {/* Glow in alto */}
            <div
              className="absolute top-0 inset-x-0 h-10"
              style={{ background: `radial-gradient(ellipse at 50% -10%, ${color}28, transparent 70%)` }}
            />

            {/* Silhouette atleta */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 10 }}>
              <svg viewBox="0 0 80 112" width={34} height={48}>
                <circle cx="40" cy="26" r="19" fill={color} opacity="0.18" />
                <circle cx="40" cy="26" r="19" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
                <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill={color} opacity="0.14" />
                <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
              </svg>
            </div>

            {/* Badge livello */}
            <div
              className="absolute top-1 left-1 font-display font-black leading-none"
              style={{
                fontSize:   8,
                padding:    '2px 4px',
                borderRadius: 2,
                background: 'rgba(0,0,0,0.75)',
                color,
                border:     `1px solid ${color}50`,
              }}
            >
              LV.{client.level}
            </div>
          </div>

          {/* Glow esterno avatar */}
          <div
            className="absolute inset-0 rounded-[3px] pointer-events-none"
            style={{ boxShadow: `0 0 12px ${color}22` }}
          />
        </div>

        {/* Info giocatore */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">

          {/* Nome + rank */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-display font-black leading-none text-white uppercase truncate"
              style={{ fontSize: 19, letterSpacing: '-0.3px' }}
            >
              {client.name}
            </span>
            <span
              className="font-display font-black shrink-0 leading-none"
              style={{
                fontSize:     12,
                padding:      '3px 7px',
                borderRadius: 3,
                background:   color + '1e',
                color,
                border:       `1px solid ${color}45`,
                boxShadow:    `0 0 8px ${color}22`,
              }}
            >
              {rankObj?.label ?? '?'}
            </span>
          </div>

          {/* XP bar */}
          <XPBar xp={client.xp} xpNext={client.xpNext} color={color} fullWidth />

          {/* XP numerico */}
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[9px] tracking-[1.5px]" style={{ color: color + '70' }}>
              {client.xp}
            </span>
            <span className="font-display text-[8px] text-white/15">/</span>
            <span className="font-display text-[9px] tracking-[1px] text-white/25">
              {client.xpNext} XP
            </span>
          </div>

        </div>
      </div>

      {/* ── Indicatore sezione attiva ───────────────────────────────────────── */}
      {tabInfo && (
        <div
          className="flex items-center gap-2 px-4 py-1.5"
          style={{ background: color + '08', borderTop: `1px solid ${color}12` }}
        >
          <span style={{ display: 'flex', color: color + '70', transform: 'scale(0.85)' }}>
            {tabInfo.icon}
          </span>
          <span
            className="font-display tracking-[2.5px] uppercase"
            style={{ fontSize: 9, color: color + '80' }}
          >
            {tabInfo.label}
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: `linear-gradient(to right, ${color}35, transparent)` }}
          />
        </div>
      )}
    </div>
  )
}
