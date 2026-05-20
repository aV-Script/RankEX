import { XPBar } from '../../../components/ui/XPBar'

export function ClientHUD({ client, color, rankObj, activeTab, tabs }) {
  const tabInfo = tabs.find(t => t.id === activeTab)
  const xpPct   = Math.min(100, Math.round((client.xp / (client.xpNext || 1)) * 100))

  return (
    <div
      className="sticky top-0 z-30 shrink-0"
      style={{
        background:     'rgba(2,5,10,0.98)',
        backdropFilter: 'blur(24px)',
        borderBottom:   `2px solid ${color}45`,
        boxShadow:      `0 0 0 1px ${color}12, 0 8px 40px rgba(0,0,0,0.8), 0 0 80px ${color}08`,
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)',
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none"
        style={{ borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none"
        style={{ borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />

      {/* ── Riga principale ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2.5 relative">

        {/* Avatar — frame con glow esterno */}
        <div className="relative shrink-0" style={{ width: 56, height: 70 }}>
          {/* Glow ring esterno */}
          <div
            className="absolute -inset-[2px] rounded-[5px] pointer-events-none"
            style={{ boxShadow: `0 0 0 1px ${color}50, 0 0 16px ${color}35` }}
          />
          <div
            className="relative overflow-hidden rounded-[4px] w-full h-full"
            style={{
              background: `linear-gradient(160deg, ${color}22 0%, rgba(2,5,10,0.96) 100%)`,
              border:     `1px solid ${color}55`,
            }}
          >
            {/* Hex texture */}
            <div className="absolute inset-0 bg-hex" style={{ opacity: 0.22 }} />

            {/* Top glow */}
            <div
              className="absolute top-0 inset-x-0 h-10"
              style={{ background: `radial-gradient(ellipse at 50% -15%, ${color}35, transparent 70%)` }}
            />

            {/* Silhouette */}
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <svg viewBox="0 0 80 112" width={36} height={50}>
                <circle cx="40" cy="26" r="19" fill={color} opacity="0.22" />
                <circle cx="40" cy="26" r="19" fill="none" stroke={color} strokeWidth="1.6" opacity="0.65" />
                <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill={color} opacity="0.18" />
                <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill="none" stroke={color} strokeWidth="1.6" opacity="0.55" />
              </svg>
            </div>

            {/* Level */}
            <div
              className="absolute top-1 left-1 font-display font-black leading-none"
              style={{
                fontSize:   7,
                padding:    '2px 4px',
                borderRadius: 2,
                background: 'rgba(0,0,0,0.85)',
                color,
                border:     `1px solid ${color}65`,
                boxShadow:  `0 0 6px ${color}50`,
              }}
            >
              LV.{client.level}
            </div>
          </div>
        </div>

        {/* Info giocatore */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">

          {/* Nome + rank */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-display font-black leading-none text-white uppercase truncate"
              style={{
                fontSize:      18,
                letterSpacing: '-0.5px',
                textShadow:    `0 0 20px ${color}40`,
              }}
            >
              {client.name}
            </span>
            <span
              className="font-display font-black shrink-0 leading-none"
              style={{
                fontSize:     10,
                padding:      '3px 7px',
                borderRadius: 2,
                background:   color + '22',
                color,
                border:       `1px solid ${color}55`,
                boxShadow:    `0 0 10px ${color}35, inset 0 0 8px ${color}10`,
                letterSpacing: '0.5px',
              }}
            >
              {rankObj?.label ?? '?'}
            </span>
          </div>

          {/* XP bar game-style */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-display text-[8px] tracking-[2.5px]" style={{ color: color + '85' }}>
                EXPERIENCE
              </span>
              <span className="font-display text-[8px] tabular-nums" style={{ color: color + '65' }}>
                {client.xp} <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span> {client.xpNext}
              </span>
            </div>

            {/* Bar container */}
            <div
              className="relative h-[7px] rounded-sm overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}20` }}
            >
              {/* Fill */}
              <div
                className="h-full rounded-sm"
                style={{
                  width:     `${xpPct}%`,
                  background: `linear-gradient(to right, ${color}80, ${color}ee)`,
                  boxShadow:  `0 0 10px ${color}90, 0 0 4px ${color}`,
                  transition: 'width 0.6s ease',
                }}
              />
              {/* Segment marks */}
              {[25, 50, 75].map(p => (
                <div
                  key={p}
                  className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${p}%`, background: 'rgba(0,0,0,0.45)' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra sezione attiva ────────────────────────────────────────── */}
      {tabInfo && (
        <div
          className="flex items-center gap-2.5 px-4 py-1.5 relative"
          style={{ background: color + '0c', borderTop: `1px solid ${color}20` }}
        >
          {/* Dot pulsante */}
          <div
            className="shrink-0 rounded-full"
            style={{
              width:     6,
              height:    6,
              background: color,
              boxShadow:  `0 0 8px ${color}, 0 0 3px ${color}`,
            }}
          />

          <span
            className="font-display tracking-[3px] uppercase"
            style={{ fontSize: 8, color: color + '95' }}
          >
            {tabInfo.label}
          </span>

          <div
            className="flex-1 h-px"
            style={{ background: `linear-gradient(to right, ${color}45, transparent)` }}
          />

          {/* Percentuale XP */}
          <span
            className="font-display font-black text-[9px] tabular-nums"
            style={{ color: color + '55', letterSpacing: '1px' }}
          >
            {xpPct}%
          </span>
        </div>
      )}
    </div>
  )
}
