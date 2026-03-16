import { useState }         from 'react'
import { useClients }       from '../../hooks/useClients'
import { useClientRank }    from '../../hooks/useClientRank'
import { AppNav }           from '../layout/AppNav'
import { CampionamentoModal } from '../modals/CampionamentoModal'
import { StatsChart }       from './StatsChart'
import { RankRing }         from '../ui/RankRing'
import { SectionLabel, Divider, ActivityLog, StatsSection } from '../ui'
import { ClientCalendar } from '../client/ClientCalendar'

export function ClientDashboard({ client, trainerId }) {
  const { handleCampionamento, deselectClient, updateLocalClient } = useClients()
  const { rankObj, color } = useClientRank(client)
  const [showCampionamento, setShowCampionamento] = useState(false)

  const prevStats = client.campionamenti?.[1]?.stats ?? null

  return (
    <div className="min-h-screen text-white">

      <AppNav
        color={color}
        left={
          <button onClick={deselectClient}
            className="bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer flex items-center gap-1.5 hover:text-white/60 transition-colors">
            ‹ Lista
          </button>
        }
      />

      {/* Hero */}
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={160} />
        <div>
          <div className="font-display font-black text-[28px] leading-none tracking-wide text-white">
            {client.name}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span className="font-display text-[12px] rounded-lg px-3 py-1"
              style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
              LIVELLO {client.level}
            </span>
            {client.categoria && (
              <span className="font-body text-[12px] text-white/30 border border-white/10 rounded-lg px-3 py-1">
                {client.categoria}
              </span>
            )}
          </div>
        </div>
        <XPBar xp={client.xp} xpNext={client.xpNext} color={color} />
      </div>

      <Divider color={color} />

      {/* Calendario */}
      <section className="px-6 py-6">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <SectionLabel>◈ Calendario allenamenti</SectionLabel>
          <ClientCalendar clientId={client.id} />
        </div>
      </section>

      <Divider color={color} />

      {/* Status */}
      <section className="px-6 pt-6 pb-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">◈ Status</SectionLabel>
            <button
              onClick={() => setShowCampionamento(true)}
              className="text-[11px] font-display px-3 py-1.5 rounded-lg cursor-pointer border transition-all"
              style={{ color, borderColor: color + '55', background: color + '11' }}
              onMouseEnter={e => e.currentTarget.style.background = color + '22'}
              onMouseLeave={e => e.currentTarget.style.background = color + '11'}>
              CAMPIONAMENTO
            </button>
          </div>
          <StatsSection stats={client.stats} prevStats={prevStats} color={color} />
        </div>
      </section>


      <Divider color={color} />

      {/* Andamento */}
      <section className="px-6 py-6">
        <StatsChart campionamenti={client.campionamenti} color={color} />
      </section>

      <Divider color={color} />

      {/* Attività */}
      <section className="px-6 py-6">
          <ActivityLog log={client.log} color={color} />
      </section>

      <div className="h-10" />

      {showCampionamento && (
        <CampionamentoModal
          client={client}
          onClose={() => setShowCampionamento(false)}
          onSave={async (s, t) => { await handleCampionamento(client, s, t) }}
        />
      )}
    </div>
  )
}

// XPBar locale — variante prominente (h-3) diversa da quella in ui/index.jsx (h-1.5)
function XPBar({ xp, xpNext, color }) {
  const pct = xpNext > 0 ? Math.round((xp / xpNext) * 100) : 0
  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-between mb-1.5">
        <span className="font-display text-[10px] text-white/30 tracking-[0.2em]">EXP</span>
        <span className="font-display text-[11px]" style={{ color }}>
          {xp.toLocaleString()} / {xpNext.toLocaleString()}
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-[width] duration-1000"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
