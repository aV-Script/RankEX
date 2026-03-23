const RANK_DECORATIONS = [
  { label: 'EX', color: '#ffd700', x: 72, y: 18, size: 80 },
  { label: 'S+', color: '#ff6fd8', x: 18, y: 42, size: 56 },
  { label: 'A',  color: '#60a5fa', x: 78, y: 62, size: 64 },
  { label: 'B+', color: '#38bdf8', x: 30, y: 75, size: 44 },
  { label: 'SS', color: '#ff8e53', x: 55, y: 38, size: 48 },
]

const STATS = [
  ['17', 'livelli di rank'],
  ['5',  'test scientifici'],
  ['∞',  'progressioni'],
]

export function BrandingPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between flex-1 p-14 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #0f1f3d 0%, #070b14 70%)' }}
    >
      <GridOverlay />
      <RankDecorations />

      <div className="relative z-10">
        <span className="font-display font-black text-[22px] text-white tracking-wider">
          FIT<span className="font-normal text-blue-400">QUEST</span>
        </span>
      </div>

      <div className="relative z-10">
        <p className="font-display text-[11px] text-blue-400 tracking-[4px] mb-4">
          PERSONAL TRAINER PORTAL
        </p>
        <h1 className="font-display font-black text-[52px] leading-[1.05] text-white m-0">
          Allena.<br />
          <span style={{ color: '#a78bfa' }}>Misura.</span><br />
          Evolvi.
        </h1>
        <p className="font-body text-white/40 text-[15px] mt-6 leading-relaxed max-w-sm">
          Trasforma ogni sessione in progressione misurabile.
          Gamifica i risultati dei tuoi clienti con statistiche
          reali e un sistema di rank dinamico.
        </p>
      </div>

      <div className="relative z-10 flex gap-8">
        {STATS.map(([num, label]) => (
          <div key={label}>
            <div className="font-display font-black text-[28px] text-white">{num}</div>
            <div className="font-body text-[12px] text-white/30 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GridOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.04,
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
    }} />
  )
}

function RankDecorations() {
  return (
    <>
      {RANK_DECORATIONS.map(({ label, color, x, y, size }) => (
        <div key={label} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: size, height: size, borderRadius: '50%',
          border: `1.5px solid ${color}33`, background: color + '08',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
          fontSize: size * 0.28, color: color + '44', userSelect: 'none',
        }}>
          {label}
        </div>
      ))}
    </>
  )
}