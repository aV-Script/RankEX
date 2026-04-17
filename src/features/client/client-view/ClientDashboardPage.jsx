import { useState }                       from 'react'
import { RankRing }                        from '../../../components/ui/RankRing'
import { XPBar }                           from '../../../components/ui/XPBar'
import { ActivityLog, StatsSection }       from '../../../components/ui'
import { StatsChart }                      from '../StatsChart'
import { getCategoriaById }                from '../../../constants'
import { BiaSummary }                      from '../../bia/bia-view/BiaSummary'
import { BiaHistoryChart }                 from '../../bia/bia-view/BiaHistoryChart'
import { getProfileCategory }              from '../../../constants/bia'
import { NotesSection }                    from '../client-dashboard/NotesSection'
import { ClientWorkoutSection }            from '../client-dashboard/ClientWorkoutSection'
import { ClientCalendar }                  from '../ClientCalendar'
import { PLAYER_ROLES }                    from '../../../config/modules.config'

// ── Icons ─────────────────────────────────────────────────────────────────────

const ICON_TEST = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const ICON_CALENDAR = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const ICON_BIA = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const ICON_WORKOUT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
    <line x1="6" y1="20" x2="18" y2="20"/>
  </svg>
)
const ICON_NOTES = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const ICON_ACTIVITY = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)
const ICON_AVATAR = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)


/**
 * Dashboard cliente (area client) — layout a 2 colonne:
 *   LEFT  → card avatar + rank + gamification
 *   RIGHT → stat tiles + tab nav + contenuto
 *
 * L'header full-width (RankEX + Bell + Logout) è fornito da ClientShell.
 */
export function ClientDashboardPage({ client, clientId, orgId, color, rankObj, biaRankObj }) {
  const prevStats   = client.campionamenti?.[1]?.stats ?? null
  const profileType = client.profileType ?? 'tests_only'
  const profile     = getProfileCategory(profileType)
  const isSoccer    = ['soccer', 'soccer_youth'].includes(client.categoria)
  const categoriaObj = !isSoccer ? getCategoriaById(client.categoria) : null
  const ruoloObj     = isSoccer
    ? PLAYER_ROLES.find(r => r.value === client.ruolo) ?? null
    : null

  const TABS = [
    { id: 'avatar',    label: 'Avatar',     icon: ICON_AVATAR,   mobileOnly: true },
    profile.hasTests && { id: 'test',     label: 'Test',       icon: ICON_TEST },
    { id: 'calendar', label: 'Calendario', icon: ICON_CALENDAR },
    profile.hasBia   && { id: 'bia',      label: 'BIA',        icon: ICON_BIA },
    orgId            && { id: 'workout',  label: 'Scheda',     icon: ICON_WORKOUT },
    orgId            && { id: 'notes',    label: 'Note',       icon: ICON_NOTES },
    { id: 'activity', label: 'Attività',  icon: ICON_ACTIVITY },
  ].filter(Boolean)

  const defaultTab = profile.hasTests ? 'test' : profile.hasBia ? 'bia' : 'calendar'
  const [activeTab, setActiveTab] = useState(() =>
    window.innerWidth < 1024 ? 'avatar' : defaultTab
  )

  const media     = client.media ?? 0
  const campCount = client.campionamenti?.length ?? 0

  return (
    <div className="flex flex-col lg:flex-row flex-1">

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <aside
        className="shrink-0 lg:w-2/5"
      >
        {/* Desktop: sticky, centrata verticalmente nell'area visibile */}
        <div className="hidden lg:flex lg:items-center sticky top-[49px] h-[calc(100vh-49px)]">
          <section className="px-4 py-6 w-full">
            <div className="rounded-[4px] p-5 rx-card flex flex-col items-center text-center">
              {/* Header card */}
              <div className="w-full flex items-center justify-between mb-5">
                <div className="font-display text-[10px] tracking-[3px] uppercase" style={{ color: '#0fd65a' }}>◈ Atleta</div>
              </div>

              {/* Avatar placeholder — visual principale */}
              <AvatarPlaceholder
                color={color}
                rankObj={rankObj}
                xp={client.xp}
                xpNext={client.xpNext}
                level={client.level}
                biaRankObj={biaRankObj}
              />

              {/* Nome */}
              <div className="mt-3 font-display font-black text-[20px] text-white leading-tight tracking-wide uppercase">
                {client.name}
              </div>

              {/* Badge categoria / ruolo */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
                {categoriaObj && (
                  <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                    style={{ background: categoriaObj.color + '18', color: categoriaObj.color, border: `1px solid ${categoriaObj.color}44` }}>
                    {categoriaObj.label.toUpperCase()}
                  </span>
                )}
                {ruoloObj && (
                  <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                    style={{ background: color + '18', color, border: `1px solid ${color}44` }}>
                    {ruoloObj.label.toUpperCase()}
                  </span>
                )}
                {client.categoria === 'soccer_youth' && (
                  <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                    style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2440' }}>
                    PICCOLI
                  </span>
                )}
                {profile.hasTests && (
                  <span className="font-display font-bold text-[11px] px-3 py-1 rounded-[3px]"
                    style={{ background: rankObj.color + '20', color: rankObj.color, border: `1px solid ${rankObj.color}50` }}>
                    {rankObj.label}
                  </span>
                )}
                {profile.hasBia && (
                  <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                    style={{ background: (biaRankObj ?? rankObj).color + '20', color: (biaRankObj ?? rankObj).color, border: `1px solid ${(biaRankObj ?? rankObj).color}50` }}>
                    BIA {(biaRankObj ?? rankObj).label}
                  </span>
                )}
              </div>

              {/* XP Bar — self-stretch forza larghezza piena nonostante items-center */}
              <div className="mt-5 self-stretch">
                <XPBar xp={client.xp} xpNext={client.xpNext} color={color} fullWidth />
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pt-8">

        {/* Tab navigation */}
        <section
          className="px-4 pt-4 pb-2 sticky top-[49px] z-10 backdrop-blur-md"
        >
          <div className="rounded-[4px] rx-card overflow-hidden">
            <div className="grid grid-flow-col auto-cols-fr px-1 py-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 px-1 lg:px-3 py-2 rounded-[3px] font-display text-[11px] tracking-[0.5px] cursor-pointer border transition-all${tab.mobileOnly ? ' lg:hidden' : ''}`}
                  style={activeTab === tab.id
                    ? { background: color + '18', borderColor: color + '55', color }
                    : { background: 'transparent', borderColor: 'transparent', color: 'rgba(255,255,255,0.35)' }
                  }
                >
                  {tab.icon}
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Contenuto tab */}
        <div className="flex-1">

          {activeTab === 'avatar' && (
            <section className="px-6 pt-6 lg:hidden">
              <div className="rounded-[4px] p-5 rx-card flex flex-col items-center text-center">
                <div className="w-full flex items-center justify-between mb-5">
                  <div className="font-display text-[10px] tracking-[3px] uppercase" style={{ color: '#0fd65a' }}>◈ Atleta</div>
                </div>
                <AvatarPlaceholder color={color} rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} level={client.level} small />
                <div className="mt-3 font-display font-black text-[20px] text-white leading-tight tracking-wide uppercase">
                  {client.name}
                </div>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
                  {categoriaObj && (
                    <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                      style={{ background: categoriaObj.color + '18', color: categoriaObj.color, border: `1px solid ${categoriaObj.color}44` }}>
                      {categoriaObj.label.toUpperCase()}
                    </span>
                  )}
                  {ruoloObj && (
                    <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                      style={{ background: color + '18', color, border: `1px solid ${color}44` }}>
                      {ruoloObj.label.toUpperCase()}
                    </span>
                  )}
                  {client.categoria === 'soccer_youth' && (
                    <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                      style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2440' }}>
                      PICCOLI
                    </span>
                  )}
                  {profile.hasTests && (
                    <span className="font-display font-bold text-[11px] px-3 py-1 rounded-[3px]"
                      style={{ background: rankObj.color + '20', color: rankObj.color, border: `1px solid ${rankObj.color}50` }}>
                      {rankObj.label}
                    </span>
                  )}
                  {profile.hasBia && (
                    <span className="font-display text-[11px] px-3 py-1 rounded-[3px]"
                      style={{ background: (biaRankObj ?? rankObj).color + '20', color: (biaRankObj ?? rankObj).color, border: `1px solid ${(biaRankObj ?? rankObj).color}50` }}>
                      BIA {(biaRankObj ?? rankObj).label}
                    </span>
                  )}
                </div>
                <div className="mt-5 self-stretch">
                  <XPBar xp={client.xp} xpNext={client.xpNext} color={color} fullWidth />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'test' && (
            <>
              <section className="px-6 py-6">
                <div className="rounded-[4px] p-5 rx-card">
                  <div className="font-display text-[10px] tracking-[3px] uppercase mb-3.5" style={{ color: '#0fd65a' }}>◈ Status</div>
                  <StatsSection stats={client.stats} prevStats={prevStats} color={color} categoria={client.categoria} />
                </div>
              </section>
              <div className="mx-6 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <section className="px-6 py-6">
                <StatsChart campionamenti={client.campionamenti} color={color} categoria={client.categoria} />
              </section>
            </>
          )}

          {activeTab === 'calendar' && (
            <div className="px-4 py-6">
              <ClientCalendar clientId={clientId} orgId={orgId} />
            </div>
          )}

          {activeTab === 'bia' && (
            <>
              <section className="px-6 py-6">
                <BiaSummary bia={client.lastBia} prevBia={client.biaHistory?.[1] ?? null} sex={client.sesso} age={client.eta} color={color} />
              </section>
              <div className="mx-6 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <section className="px-6 py-6">
                <BiaHistoryChart biaHistory={client.biaHistory} color={color} />
              </section>
            </>
          )}

          {activeTab === 'workout' && (
            <ClientWorkoutSection orgId={orgId} clientId={clientId} color={color} />
          )}

          {activeTab === 'notes' && orgId && (
            <NotesSection orgId={orgId} clientId={clientId} color={color}
              author={{ role: 'client', name: client.name }} />
          )}

          {activeTab === 'activity' && (
            <section className="px-6 py-6">
              <ActivityLog log={client.log} color={color} />
            </section>
          )}

        </div>
      </div>
    </div>
  )
}

// ── AvatarPlaceholder ─────────────────────────────────────────────────────────

function AvatarPlaceholder({ color, rankObj, xp, xpNext, level, biaRankObj, compact = false, small = false }) {
  if (compact) {
    return <RankRing rankObj={rankObj} xp={xp} xpNext={xpNext} size={72} animated={false} />
  }

  const W    = small ? 110 : 174
  const H    = small ? 138 : 218
  const ring = small ? 62  : 82
  const rMt  = small ? -18 : -24
  const rMl  = small ? -12 : -16

  return (
    <div style={{ width: W }}>
      {/* Card portrait */}
      <div
        className="relative overflow-hidden rounded-[4px]"
        style={{
          height: H,
          background: 'linear-gradient(170deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
          border: `1px solid ${color}28`,
        }}
      >
        {/* Pattern esagonale */}
        <div className="absolute inset-0 bg-hex" style={{ opacity: 0.14 }} />

        {/* Alone colore in alto */}
        <div className="absolute top-0 left-0 right-0 h-28"
          style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}22 0%, transparent 65%)` }} />

        {/* Silhouette atleta */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 28 }}>
          <svg viewBox="0 0 80 112" width={small ? 58 : 90} height={small ? 80 : 126}>
            <circle cx="40" cy="26" r="19" fill={color} opacity="0.18" />
            <circle cx="40" cy="26" r="19" fill="none" stroke={color} strokeWidth="1.4" opacity="0.45" />
            <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill={color} opacity="0.14" />
            <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill="none" stroke={color} strokeWidth="1.4" opacity="0.38" />
            <path d="M24,62 Q28,76 40,78 Q52,76 56,62" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
          </svg>
        </div>

        {/* Gradiente basso */}
        <div className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: `linear-gradient(to top, ${color}22, transparent)` }} />

        {/* Badge livello — top-left */}
        <div
          className="absolute top-2 left-2 font-display font-black text-[10px] px-1.5 py-0.5 rounded-[3px]"
          style={{ background: 'rgba(0,0,0,0.65)', color, border: `1px solid ${color}50` }}
        >
          LV.{level}
        </div>

        {/* Watermark */}
        {!small && (
          <div
            className="absolute bottom-2.5 right-2.5 font-display text-[7px] tracking-[3px] uppercase"
            style={{ color: color + '45' }}
          >
            Avatar
          </div>
        )}
      </div>

    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display font-black text-[22px] leading-none" style={{ color }}>{value}</span>
      <span className="font-display text-[9px] tracking-[2px] text-white/30 uppercase">{label}</span>
    </div>
  )
}
