import { useState } from 'react'
import { useClients }    from '../../hooks/useClients'
import { useMissions }   from '../../hooks/useMissions'
import { CampionamentoModal } from '../modals/CampionamentoModal'
import { MissionsPanel }  from './MissionsPanel'
import { StatsChart }     from './StatsChart'
import { RankRing }       from '../ui/RankRing'
import { Pentagon }       from '../ui/Pentagon'
import { SectionLabel }   from '../ui'
import { STATS }          from '../../constants'
import { calcStatMedia }  from '../../utils/percentile'
import { getRankFromMedia } from '../../constants'

export function ClientDashboard({ client, trainerId }) {
  const { handleCampionamento, deselectClient, updateLocalClient } = useClients()
  const [showCampionamento, setShowCampionamento] = useState(false)

  const media   = calcStatMedia(client.stats ?? {})
  const rankObj = getRankFromMedia(media)
  const color   = client.rankColor ?? rankObj.color

  const {
    missions, customTemplates,
    handleAddMission, handleCompleteMission, handleDeleteMission,
  } = useMissions(client, trainerId, updateLocalClient)

  const prevStats = client.campionamenti?.[1]?.stats ?? null

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)' }}
    >
      {/* Navbar */}
      <nav className="px-6 py-4 border-b border-white/[.05] flex items-center">
        {/* zona sinistra — stessa larghezza della destra per centrare il logo */}
        <div className="flex-1">
          <button
            onClick={deselectClient}
            className="bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer flex items-center gap-1.5 hover:text-white/60 transition-colors"
          >
            ‹ Lista
          </button>
        </div>
        {/* logo centrato */}
        <span
          className="font-display font-black text-[18px] shrink-0"
          style={{ background: `linear-gradient(90deg, #60a5fa, ${color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          FITQUEST
        </span>
        {/* zona destra — bilanciamento */}
        <div className="flex-1" />
      </nav>

      {/* Hero: Ring + Nome + XP */}
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={160} />
        <div>
          <div className="font-display font-black text-[28px] leading-none tracking-wide text-white">
            {client.name}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className="font-display text-[12px] rounded-lg px-3 py-1"
              style={{ background: color + '22', color, border: `1px solid ${color}44` }}
            >
              LIVELLO {client.level}
            </span>
            {client.categoria && (
              <span className="font-body text-[12px] text-white/30 border border-white/10 rounded-lg px-3 py-1">
                {client.categoria}
              </span>
            )}
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex justify-between mb-1.5">
            <span className="font-display text-[10px] text-white/30 tracking-[0.2em]">EXP</span>
            <span className="font-display text-[11px]" style={{ color }}>
              {client.xp.toLocaleString()} / {client.xpNext.toLocaleString()}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-1000"
              style={{
                width: `${client.xpNext > 0 ? Math.round((client.xp / client.xpNext) * 100) : 0}%`,
                background: color,
              }}
            />
          </div>
        </div>
      </div>

      <Divider color={color} />

      {/* Status Window */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">◈ Status</SectionLabel>
          <button
            onClick={() => setShowCampionamento(true)}
            className="text-[11px] font-display px-3 py-1.5 rounded-lg cursor-pointer border transition-all"
            style={{ color, borderColor: color + '55', background: color + '11' }}
            onMouseEnter={e => e.currentTarget.style.background = color + '22'}
            onMouseLeave={e => e.currentTarget.style.background = color + '11'}
          >
            + CAMPIONAMENTO
          </button>
        </div>
        <div className="grid gap-6" style={{ gridTemplateColumns: '3fr 2fr' }}>
          {/* Stat a sinistra */}
          <div className="flex flex-col justify-center gap-3">
            {STATS.map(({ key, icon, label }) => {
              const val   = client.stats?.[key] ?? 0
              const prev  = prevStats?.[key] ?? null
              const delta = prev !== null ? val - prev : null
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[14px] w-5 shrink-0">{icon}</span>
                  <span className="font-body text-[12px] text-white/50 w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${val}%`, background: color }} />
                  </div>
                  <span className="font-display text-[12px] w-7 text-right tabular-nums" style={{ color }}>{val}</span>
                  {delta !== null && (
                    <span
                      className="font-display text-[10px] w-8 text-right tabular-nums"
                      style={{ color: delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}
                    >
                      {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {/* Pentagon a destra */}
          <div className="flex items-center justify-center">
            <Pentagon stats={client.stats} color={color} size={130} />
          </div>
        </div>
      </section>

      <Divider color={color} />

      {/* Quest Log */}
      <section className="px-6 py-6">
        <MissionsPanel
          client={{ ...client, missions }}
          color={color}
          onAddMission={handleAddMission}
          onCompleteMission={handleCompleteMission}
          onDeleteMission={handleDeleteMission}
          customTemplates={customTemplates}
        />
      </section>

      <Divider color={color} />

      {/* Grafico andamento */}
      <section className="px-6 py-6">
        <SectionLabel>◈ Andamento</SectionLabel>
        <StatsChart campionamenti={client.campionamenti} color={color} />
      </section>

      <Divider color={color} />

      {/* Activity + Badge */}
      <section className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityLog log={client.log} color={color} />
          <BadgeList badges={client.badges} color={color} />
        </div>
      </section>

      <div className="h-10" />

      {showCampionamento && (
        <CampionamentoModal
          client={client}
          onClose={() => setShowCampionamento(false)}
          onSave={async (s, t, n) => { await handleCampionamento(client, s, t, n) }}
        />
      )}
    </div>
  )
}

function Divider({ color }) {
  return (
    <div className="px-6">
      <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}33, transparent)` }} />
    </div>
  )
}

function ActivityLog({ log = [], color }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <SectionLabel>◈ Attività recenti</SectionLabel>
      {log.length === 0 && <p className="m-0 font-body text-[13px] text-white/20">Nessuna attività ancora.</p>}
      {log.slice(0, 5).map((entry, i) => (
        <div key={i} className="flex gap-2.5 items-start mb-2.5">
          <div className="flex flex-col items-center pt-1.5 gap-1">
            <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: color + '88' }} />
            {i < Math.min(log.length, 5) - 1 && <div className="w-px flex-1 min-h-[12px]" style={{ background: 'rgba(255,255,255,0.06)' }} />}
          </div>
          <div className="flex-1 pb-1">
            <div className="font-body text-[13px] text-white/70">{entry.action}</div>
            <div className="flex gap-2 mt-0.5">
              <span className="font-body text-[11px] text-white/20">{entry.date}</span>
              {entry.xp > 0 && <span className="font-display text-[10px] text-emerald-400">+{entry.xp} XP</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BadgeList({ badges = [], color }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <SectionLabel>◈ Badge conquistati</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {badges.map((b, i) => (
          <span key={i} className="font-body text-[13px] rounded-lg px-3 py-1.5"
            style={{ background: color + '11', border: `1px solid ${color}33`, color: 'rgba(255,255,255,0.7)' }}>
            {b}
          </span>
        ))}
        {badges.length === 0 && <p className="m-0 font-body text-[13px] text-white/20">Nessun badge ancora.</p>}
      </div>
    </div>
  )
}
