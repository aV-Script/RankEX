import { Pentagon }       from '../../components/ui/Pentagon'
import { RankRing }       from '../../components/ui/RankRing'
import { useClientRank }  from '../../hooks/useClientRank'
import { getStatsConfig, getCategoriaById } from '../../constants'

export function PlayerCard({ client, onEnter }) {
  const { rankObj, color } = useClientRank(client)
  const xpPct  = client.xpNext > 0 ? Math.round((client.xp / client.xpNext) * 100) : 0
  const config = getStatsConfig(client.categoria)
  const statKeys   = config.map(s => s.stat)
  const statLabels = config.map(s => s.label)
  const categoria  = getCategoriaById(client.categoria)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)' }}
    >
      {/* Card */}
      <div
        className="relative overflow-hidden"
        style={{
          width: 340, height: 520,
          background: '#0a1628',
          border: `1px solid ${color}33`,
          borderRadius: 20,
          boxShadow: `0 0 60px ${color}22`,
        }}
      >
        {/* Barra colore top */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-[20px]"
          style={{ background: color }}
        />

        {/* Header */}
        <div className="px-5 pt-5 pb-0">
          <div
            className="font-display text-[11px] text-white/30 tracking-[0.2em] uppercase mb-1"
          >
            FITQUEST · PROFILO
          </div>
          <div className="font-display font-black text-[26px] text-white leading-none">
            {client.name}
          </div>
          <div className="flex gap-2 mt-2">
            <span
              className="font-display text-[11px] rounded-md px-2 py-0.5"
              style={{ color, background: color + '22', border: `1px solid ${color}44` }}
            >
              LVL {client.level}
            </span>
            {categoria && (
              <span className="font-display text-[11px] text-white/30 border border-white/[.08] rounded-md px-2 py-0.5">
                {categoria.label}
              </span>
            )}
          </div>
        </div>

        {/* Stats + Pentagon */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <div className="flex flex-col gap-1.5 flex-1">
            {config.map(({ stat, label }) => {
              const val = client.stats?.[stat] ?? 0
              return (
                <div key={stat} className="flex items-center gap-2">
                  <span className="font-display text-[10px] text-white/40 w-16 shrink-0">
                    {label}
                  </span>
                  <div
                    className="flex-1 h-[3px] rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${val}%`, background: color + 'cc' }}
                    />
                  </div>
                  <span
                    className="font-display text-[10px] w-5 text-right"
                    style={{ color }}
                  >
                    {val}
                  </span>
                </div>
              )
            })}
          </div>

          <Pentagon
            stats={client.stats}
            statKeys={statKeys}
            statLabels={statLabels}
            color={color}
            size={110}
          />
        </div>

        {/* Rank ring + XP */}
        <div className="px-5 pt-2">
          <div className="flex items-center gap-4">
            <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={90} />
            <div className="flex-1">
              <div className="flex justify-between mb-1.5">
                <span className="font-display text-[10px] text-white/30 tracking-[0.2em]">EXP</span>
                <span className="font-display text-[10px]" style={{ color }}>
                  {client.xp.toLocaleString()} / {client.xpNext.toLocaleString()}
                </span>
              </div>
              <div
                className="h-[5px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-1000"
                  style={{ width: `${xpPct}%`, background: color }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-3 left-0 right-0 text-center font-display text-[9px] text-white/10 tracking-[3px]">
          FITQUEST
        </div>
      </div>
    </div>
  )
}