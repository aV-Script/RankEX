import { useState, useEffect } from 'react'
import { getClientById, logout } from '../../firebase/services'
import { useClientRank } from '../../hooks/useClientRank'
import { useNotifications } from '../../hooks/useNotifications'
import { AppNav } from '../layout/AppNav'
import { RankRing } from '../ui/RankRing'
import { SectionLabel, Divider, ActivityLog, StatsSection } from '../ui'
import { StatsChart } from '../dashboard/StatsChart'
import { PlayerCard } from './PlayerCard'
import { ClientCalendar } from './ClientCalendar'
import { NotificationsPanel } from '../layout/NotificationsPanel'

export default function ClientView({ clientId }) {
  // ── HOOKS TOP LEVEL ──────────────────────────────
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('card') // 'card' o 'dashboard'
  const [showNotifs, setShowNotifs] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')

  const { rankObj, color } = useClientRank(client)
  const { notifications, unreadCount, markAllRead, remove } = useNotifications(clientId)

  // ── FETCH CLIENT ─────────────────────────────────
  useEffect(() => {
    getClientById(clientId)
      .then(c => setClient(c))
      .finally(() => setLoading(false))
  }, [clientId])

  // ── HANDLER NOTIFICHE ───────────────────────────
  const handleOpenNotifs = async () => {
    setShowNotifs(true)
    await markAllRead()
  }

  // ── LOADING / CLIENT NON TROVATO ───────────────
  if (loading) return <FullScreenMsg>CARICAMENTO...</FullScreenMsg>
  if (!client) return <FullScreenMsg>Profilo non trovato.</FullScreenMsg>

  // ── PLAYER CARD VIEW ────────────────────────────
  if (view === 'card') 
    return <PlayerCard client={client} onEnter={() => setView('dashboard')} />

  // ── PREPARAZIONI PAGINA DASHBOARD ──────────────
  const prevStats = client.campionamenti?.[1]?.stats ?? null

  // ── ICONS & NAV ITEMS ──────────────────────────
  const Icons = {
    dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    calendar:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    profile:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  }

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'calendar',  label: 'Calendario', icon: Icons.calendar },
    { id: 'profile',   label: 'Profilo',    icon: Icons.profile },
  ]

  // ── RENDER PRINCIPALE ──────────────────────────
  return (
    <div className="min-h-screen text-white flex flex-col lg:flex-row">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col items-center py-6 gap-2 sticky top-0 h-screen shrink-0 z-30 border-r border-white/[.05]"
        style={{ width: 64, backdropFilter: 'blur(12px)' }}>
        <div className="mb-4">
          <span className="font-display font-black text-[13px]"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FQ
          </span>
        </div>
        <nav className="flex flex-col items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <div key={item.id} className="relative group">
              <button onClick={() => setActivePage(item.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border"
                style={{
                  background:  activePage === item.id ? 'rgba(59,130,246,0.18)' : 'transparent',
                  borderColor: activePage === item.id ? 'rgba(59,130,246,0.4)'  : 'transparent',
                  color:       activePage === item.id ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                }}>
                {item.icon}
              </button>
              <div className="absolute left-[52px] top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: 'rgba(15,31,61,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', whiteSpace: 'nowrap' }}>
                <span className="font-display text-[11px] text-white/80 tracking-[1px]">{item.label.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </nav>

        {/* Notifiche */}
        <button onClick={handleOpenNotifs}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border border-transparent hover:border-white/10"
          style={{ color: unreadCount > 0 ? color : 'rgba(255,255,255,0.35)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full font-display text-[9px] flex items-center justify-center text-white"
              style={{ background: color }}>{unreadCount}</span>
          )}
        </button>

        <button onClick={logout} title="Esci"
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border border-transparent hover:border-white/10 text-white/25 hover:text-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </aside>

      {/* Mobile: header + tab bar */}
      <div className="lg:hidden flex-none">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/[.05] sticky top-0 z-30"
          style={{ backdropFilter: 'blur(12px)' }}>
          <span className="font-display font-black text-[17px]"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FITQUEST
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenNotifs}
              className="relative w-9 h-9 flex items-center justify-center"
              style={{ color: unreadCount > 0 ? color : 'rgba(255,255,255,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full font-display text-[9px] flex items-center justify-center text-white"
                  style={{ background: color }}>{unreadCount}</span>
              )}
            </button>
            <button onClick={logout} className="text-white/30 hover:text-white/60 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>
        <nav className="flex border-b border-white/[.05] sticky top-[49px] z-20"
          style={{ backdropFilter: 'blur(12px)' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer transition-all relative border-none"
              style={{ background: 'transparent' }}>
              {activePage === item.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                  style={{ width: 32, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
              )}
              <span style={{ color: activePage === item.id ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>{item.icon}</span>
              <span className="font-display text-[9px] tracking-[0.5px]"
                style={{ color: activePage === item.id ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>
                {item.label.toUpperCase()}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenuto */}
      <main className="flex-1 min-w-0">
        {activePage === 'dashboard' && <DashboardPage client={client} color={color} rankObj={rankObj} prevStats={prevStats} />}
        {activePage === 'calendar' && (
          <div className="px-4 py-6">
            <ClientCalendar clientId={clientId} sessionsPerWeek={client.sessionsPerWeek} />
          </div>
        )}
        {activePage === 'profile' && <ProfilePage client={client} color={color} onCard={() => setView('card')} />}
      </main>

      {showNotifs && (
        <NotificationsPanel notifications={notifications} color={color}
          onClose={() => setShowNotifs(false)} onDelete={remove} />
      )}
    </div>
  )
}

// ── COMPONENTI LOCALI ─────────────────────────────
function DashboardPage({ client, color, rankObj, prevStats }) {
  return (
    <div>
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={160} />
        <div>
          <div className="font-display font-black text-[28px] leading-none tracking-wide text-white">{client.name}</div>
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
      <section className="px-6 py-6">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <SectionLabel>◈ Status</SectionLabel>
          <StatsSection
              stats={client.stats}
              prevStats={prevStats}
              color={color}
              categoria={client.categoria}
            />
        </div>
      </section>
      <Divider color={color} />
      <section className="px-6 py-6">
        <StatsChart campionamenti={client.campionamenti} color={color}  categoria={client.categoria}/>
      </section>
      <Divider color={color} />
      <section className="px-6 py-6">
        <ActivityLog log={client.log} color={color} />
      </section>
      <div className="h-10" />
    </div>
  )
}

function ProfilePage({ client, color, onCard }) {
  return (
    <div className="px-6 py-8 max-w-lg">
      <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-6">PROFILO</p>
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: color + '22', border: `1px solid ${color}44` }}>
            <span className="font-display font-black text-[22px]" style={{ color }}>
              {client.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-display font-black text-[16px] text-white">{client.name}</div>
            <div className="font-body text-[13px] text-white/40 mt-0.5">{client.email ?? '—'}</div>
          </div>
        </div>
      </div>
      <button onClick={onCard}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer transition-all text-left border"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} >
        <span className="font-body text-[13px] text-white/60">Visualizza Player Card</span>
        <span className="ml-auto text-white/30">›</span>
      </button>
    </div>
  )
}

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

function FullScreenMsg({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-display text-white/30 tracking-[3px] text-[13px]">{children}</div>
    </div>
  )
}