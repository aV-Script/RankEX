import { useState }         from 'react'
import { useClients }       from '../../hooks/useClients'
import { useClientRank }    from '../../hooks/useClientRank'
import { AppNav }           from '../layout/AppNav'
import { CampionamentoModal } from '../modals/CampionamentoModal'
import { StatsChart }       from './StatsChart'
import { RankRing }         from '../ui/RankRing'
import { SectionLabel, Divider, ActivityLog, StatsSection } from '../ui'
import { ClientCalendar } from '../client/ClientCalendar'
import { deleteClient } from '../../firebase/clients'

export function ClientDashboard({ client, trainerId }) {
  const { handleCampionamento, updateLocalClient, deselectClient } = useClients()
  const { rankObj, color } = useClientRank(client)
  const [showCampionamento, setShowCampionamento] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const prevStats = client.campionamenti?.[1]?.stats ?? null
  const handleDelete = async () => {
    await deleteClient(client.id)
    updateLocalClient(client.id, null) // segnala al context di rimuoverlo
    deselectClient()
    setShowDelete(false)
  }
  return (
    <div className="min-h-screen text-white">

      <AppNav
        color={color}
        left={null}
        right={
          <button
            onClick={() => setShowDelete(true)}
            className="bg-transparent border border-red-500/20 rounded-xl px-3 py-1.5 text-red-400/50 font-display text-[11px] cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all">
            ELIMINA
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
          <StatsSection
              stats={client.stats}
              prevStats={prevStats}
              color={color}
              categoria={client.categoria}
            />
        </div>
      </section>


      <Divider color={color} />

      {/* Andamento */}
      <section className="px-6 py-6">
        <StatsChart campionamenti={client.campionamenti} color={color} categoria={client.categoria}/>
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

      {showDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
          onClick={() => setShowDelete(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-black text-[16px] text-white mb-2">Elimina cliente</h3>
            <p className="font-body text-[13px] text-white/50 mb-6">
              Stai per eliminare <strong className="text-white">{client.name}</strong>. 
              Questa azione è irreversibile.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/70 transition-all">
                ANNULLA
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border-0 transition-opacity hover:opacity-85"
                style={{ background: '#ef4444', color: '#fff' }}>
                ELIMINA
              </button>
            </div>
          </div>
        </div>
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
