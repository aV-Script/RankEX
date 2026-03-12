import { useState, useEffect } from 'react'
import { getClientById, getNotifications, markAllNotificationsRead, getMissions, logout } from '../../firebase/services'
import { Pentagon }   from '../ui/Pentagon'
import { RankRing }   from '../ui/RankRing'
import { SectionLabel } from '../ui'
import { StatsChart } from '../dashboard/StatsChart'
import { STATS }      from '../../constants'
import { calcStatMedia } from '../../utils/percentile'
import { getRankFromMedia } from '../../constants'
import { MISSION_STATUS } from '../../constants/missions'
import { PlayerCard } from './PlayerCard'

export default function ClientView({ clientId }) {
  const [client,        setClient]        = useState(null)
  const [notifications, setNotifications] = useState([])
  const [missions,      setMissions]      = useState([])
  const [showNotifs,    setShowNotifs]    = useState(false)
  const [loading,       setLoading]       = useState(true)
  // 'card' = vista PlayerCard al login | 'dashboard' = vista dettagliata
  const [view,          setView]          = useState('card')

  useEffect(() => {
    Promise.all([
      getClientById(clientId),
      getNotifications(clientId),
      getMissions(clientId),
    ]).then(([c, n, m]) => {
      setClient(c)
      setNotifications(n)
      setMissions(m)
    }).finally(() => setLoading(false))
  }, [clientId])

  const handleOpenNotifs = async () => {
    setShowNotifs(true)
    const unread = notifications.filter(n => !n.read)
    if (unread.length > 0) {
      await markAllNotificationsRead(clientId)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <div className="font-display text-white/30 tracking-[3px] text-[13px]">CARICAMENTO...</div>
    </div>
  )

  if (!client) return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <div className="font-display text-white/30 text-[13px]">Profilo non trovato.</div>
    </div>
  )

  const media          = calcStatMedia(client.stats ?? {})
  const rankObj        = getRankFromMedia(media)
  const color          = client.rankColor ?? rankObj.color
  const unreadCount    = notifications.filter(n => !n.read).length
  const activeMissions = missions.filter(m => m.status === MISSION_STATUS.ACTIVE)
  const prevStats      = client.campionamenti?.[1]?.stats ?? null

  // Vista PlayerCard — mostrata al primo login
  if (view === 'card') {
    return <PlayerCard client={client} onEnter={() => setView('dashboard')} />
  }

  // Vista Dashboard dettagliata (read-only per il cliente)
  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)' }}
    >
      {/* Navbar */}
      <nav className="px-6 py-4 border-b border-white/[.05] flex items-center sticky top-0 z-10"
        style={{ background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="flex-1">
          <button
            onClick={() => setView('card')}
            className="bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer flex items-center gap-1.5 hover:text-white/60 transition-colors"
          >
            ‹ Card
          </button>
        </div>
        <span
          className="font-display font-black text-[18px] shrink-0"
          style={{ background: `linear-gradient(90deg, #60a5fa, ${color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          FITQUEST
        </span>
        <div className="flex-1 flex justify-end items-center gap-2">
          <button
            onClick={handleOpenNotifs}
            className="relative bg-transparent border border-white/10 rounded-xl px-3 py-1.5 text-white/40 font-body text-[13px] cursor-pointer hover:text-white/70 transition-all"
          >
            
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full font-display text-[10px] flex items-center justify-center text-white"
                style={{ background: color }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={logout}
            className="bg-transparent border border-white/10 rounded-xl px-3 py-1.5 text-white/40 font-body text-[13px] cursor-pointer hover:text-white/60 transition-all"
          >
            Esci
          </button>
        </div>
      </nav>

      {/* Hero: Ring + Nome + XP */}
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

        {/* XP bar prominente */}
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
        <SectionLabel>◈ Status</SectionLabel>
        <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 3fr' }}>
          <div className="flex items-center justify-center">
            <Pentagon stats={client.stats} color={color} fluid size={200} />
          </div>
          <div className="flex flex-col justify-center gap-3">
            {STATS.map(({ key, icon, label }) => {
              const val   = client.stats?.[key] ?? 0
              const prev  = prevStats?.[key] ?? null
              const delta = prev !== null ? val - prev : null
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[14px] w-5 shrink-0">{icon}</span>
                  <span className="font-body text-[12px] text-white/50 w-24 shrink-0">{label}</span>
                  <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${val}%`, background: color }} />
                  </div>
                  <span className="font-display text-[12px] w-7 text-right tabular-nums" style={{ color }}>{val}</span>
                  {delta !== null && (
                    <span className="font-display text-[10px] w-8 text-right tabular-nums"
                      style={{ color: delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                      {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      <Divider color={color} />

      {/* Missioni read-only */}
      <section className="px-6 py-6">
        <SectionLabel>◈ Quest attive</SectionLabel>
        {activeMissions.length === 0 && (
          <p className="font-body text-[13px] text-white/20">Nessuna missione attiva.</p>
        )}
        {activeMissions.map(m => (
          <div key={m.id}
            className="rounded-xl p-3.5 mb-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}22` }}
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-body font-bold text-[14px] text-white">{m.name}</div>
                {m.description && <div className="text-white/40 font-body text-[12px] mt-0.5">{m.description}</div>}
              </div>
              <span className="font-display text-[12px] whitespace-nowrap shrink-0" style={{ color: '#facc15' }}>
                {m.xp} XP
              </span>
            </div>
          </div>
        ))}
      </section>

      <Divider color={color} />

      {/* Grafico */}
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

      {showNotifs && (
        <NotificationsPanel notifications={notifications} color={color} onClose={() => setShowNotifs(false)} />
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

function NotificationsPanel({ notifications, color, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-gray-900 border-l border-white/10 h-full overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-white text-[15px] m-0">Notifiche</h3>
          <button onClick={onClose} className="bg-transparent border-none text-white/40 text-xl cursor-pointer hover:text-white/70">✕</button>
        </div>
        {notifications.length === 0 && (
          <p className="text-white/20 font-body text-[13px] text-center py-8">Nessuna notifica.</p>
        )}
        {notifications.map(n => (
          <div key={n.id}
            className={`rounded-xl p-3.5 mb-2 border transition-all ${n.read ? 'border-white/[.05] bg-white/[.02]' : 'border-white/10 bg-white/[.05]'}`}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className={`font-body text-[13px] ${n.read ? 'text-white/50' : 'text-white'}`}>{n.message}</div>
                <div className="text-white/20 font-body text-[11px] mt-1">{n.date}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: color }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
