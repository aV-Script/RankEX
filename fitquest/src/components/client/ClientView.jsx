import { useState, useEffect }   from 'react'
import { getClientById, logout } from '../../firebase/services'
import { useClientRank }    from '../../hooks/useClientRank'
import { useNotifications } from '../../hooks/useNotifications'
import { AppNav }           from '../layout/AppNav'
import { RankRing }         from '../ui/RankRing'
import { SectionLabel, Divider, ActivityLog, StatsSection } from '../ui'
import { StatsChart }       from '../dashboard/StatsChart'
import { PlayerCard }       from './PlayerCard'
import { ClientCalendar }  from './ClientCalendar'
import { NotificationsPanel } from '../layout/NotificationsPanel'

export default function ClientView({ clientId }) {
  const [client,  setClient]  = useState(null)
  const [loading,  setLoading] = useState(true)
  const [view,     setView]    = useState('card')
  const [showNotifs, setShowNotifs] = useState(false)

  const { rankObj, color } = useClientRank(client)
  const { notifications, unreadCount, markAllRead, remove } = useNotifications(clientId)

  useEffect(() => {
    getClientById(clientId).then(c => setClient(c))
      .finally(() => setLoading(false))
  }, [clientId])

  const handleOpenNotifs = async () => {
    setShowNotifs(true)
    await markAllRead()
  }

  if (loading) return <FullScreenMsg>CARICAMENTO...</FullScreenMsg>
  if (!client)  return <FullScreenMsg>Profilo non trovato.</FullScreenMsg>

  const prevStats      = client.campionamenti?.[1]?.stats ?? null

  if (view === 'card') return <PlayerCard client={client} onEnter={() => setView('dashboard')} />

  return (
    <div className="min-h-screen text-white">

      <AppNav
        color={color}
        left={
          <button onClick={() => setView('card')}
            className="bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer flex items-center gap-1.5 hover:text-white/60 transition-colors">
            ‹ Card
          </button>
        }
        right={
          <>
            <NotifBell count={unreadCount} color={color} onClick={handleOpenNotifs} />
            <button onClick={logout}
              className="bg-transparent border border-white/10 rounded-xl px-3 py-1.5 text-white/40 font-body text-[13px] cursor-pointer hover:text-white/60 transition-all">
              Esci
            </button>
          </>
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
          <ClientCalendar clientId={clientId} />
        </div>
      </section>

      <Divider color={color} />

      {/* Status */}
      <section className="px-6 py-6">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <SectionLabel>◈ Status</SectionLabel>
          <StatsSection stats={client.stats} prevStats={prevStats} color={color} />
        </div>
      </section>


      <Divider color={color} />

      {/* Andamento */}
      <section className="px-6 py-6">
        <StatsChart campionamenti={client.campionamenti} color={color} />
      </section>

      <Divider color={color} />

      {/* Attività dge */}
      <section className="px-6 py-6">
          <ActivityLog log={client.log} color={color} />
      </section>

      <div className="h-10" />

      {showNotifs && (
        <NotificationsPanel
          notifications={notifications}
          color={color}
          onClose={() => setShowNotifs(false)}
          onDelete={remove}
        />
      )}
    </div>
  )
}

// ── Componenti locali leggeri ─────────────────────────────────────────────────


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


function NotifBell({ count, color, onClick }) {
  return (
    <button onClick={onClick}
      className="relative bg-transparent border border-white/10 rounded-xl w-9 h-9 flex items-center justify-center cursor-pointer hover:border-white/20 transition-all">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={count > 0 ? color : 'rgba(255,255,255,0.4)'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full font-display text-[9px] flex items-center justify-center text-white"
          style={{ background: color }}>
          {count}
        </span>
      )}
    </button>
  )
}

function FullScreenMsg({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-display text-white/30 tracking-[3px] text-[13px]">{children}</div>
    </div>
  )
}
