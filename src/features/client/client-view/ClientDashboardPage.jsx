import { useState }                  from 'react'
import { ActivityLog, StatsSection }  from '../../../components/ui'
import { StatsChart }                 from '../StatsChart'
import { BiaSummary }                 from '../../bia/bia-view/BiaSummary'
import { BiaHistoryChart }            from '../../bia/bia-view/BiaHistoryChart'
import { getProfileCategory }         from '../../../constants/bia'
import { NotesSection }               from '../client-dashboard/NotesSection'
import { ClientWorkoutSection }       from '../client-dashboard/ClientWorkoutSection'
import { MisureSection }              from '../client-dashboard/MisureSection'
import { ClientCalendar }             from '../ClientCalendar'
import { calcAge }                    from '../../../utils/validation'
import { ClientHub }                  from './ClientHub'
import { ClientBottomNav }            from './ClientBottomNav'
import { AvatarPicker }               from './avatar/AvatarPicker'
import { TrophiesSection }            from '../client-dashboard/TrophiesSection'
import { XPTrendChart }               from '../client-dashboard/XPTrendChart'
import { useBadges }                  from '../../../hooks/useBadges'
import { ThemePicker }                from '../../../components/ui/ThemePicker'
import { useColorSource }            from '../../../hooks/useColorSource'
import { logout }                     from '../../../firebase/services/auth'

// ── Icone sub-tab ─────────────────────────────────────────────────────────────

const ICON_AVATAR_EDIT = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
)
const ICON_NOTE = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const ICON_ATTIVITA = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const ICON_MISURE = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
  </svg>
)
const ICON_TEMA = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0 0 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
)
const ICON_ACCOUNT = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const ICON_FISICI = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const ICON_BIA_SUB = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const ICON_LOGOUT = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

// ── Sub-tab bar riutilizzabile ─────────────────────────────────────────────────

function SubTabBar({ tabs, active, onSelect, stickyClass = 'sticky top-0 lg:top-[52px]' }) {
  return (
    <div
      className={`${stickyClass} z-20 relative`}
      style={{ background: 'var(--rx-nav-bg)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          justifyContent: 'safe center',
          scrollbarWidth: 'none',
        }}
      >
      {tabs.map(t => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 8px', height: 44, flexShrink: 0,
              cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--rx-green)' : 'transparent'}`,
              transition: 'border-color 150ms',
            }}
          >
            <span style={{ color: isActive ? 'var(--rx-green)' : 'rgba(255,255,255,0.28)', transition: 'color 150ms' }}>
              {t.icon}
            </span>
            <span className="font-display" style={{
              fontWeight: 700,
              fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase',
              color: isActive ? 'var(--rx-green)' : 'rgba(255,255,255,0.25)', transition: 'color 150ms',
              whiteSpace: 'nowrap',
            }}>
              {t.label}
            </span>
          </button>
        )
      })}
      </div>
      {/* Fade destra — affordance scroll su mobile */}
      <div
        className="lg:hidden"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 40,
          background: 'linear-gradient(to right, transparent, var(--rx-nav-bg))',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────────────────

export function ClientDashboardPage({
  client, clientId, orgId, color, rankObj, biaRankObj,
  unreadCount = 0, onOpenNotifs,
}) {
  const prevStats   = client.campionamenti?.[1]?.stats ?? null
  const profileType = client.profileType ?? 'tests_only'
  const profile     = getProfileCategory(profileType)
  const age         = calcAge(client.dataNascita)

  const { earnedBadges, allBadges, rawBadges, badgeProgress, handleUpdateShowcase } =
    useBadges(orgId, clientId, client, { readonly: true })

  const [activeTab,    setActiveTab]    = useState('home')
  const [profiloTab,   setProfiloTab]   = useState('avatar')
  const [testTab,      setTestTab]      = useState('fisici')
  const [colorSource,  setColorSource]  = useColorSource()

  const displayColor = colorSource === 'rank'
    ? color
    : getComputedStyle(document.documentElement).getPropertyValue('--rx-green').trim() || color

  // Sub-tab Profilo
  const profiloTabs = [
    { id: 'avatar',   label: 'Avatar',   icon: ICON_AVATAR_EDIT },
    orgId && { id: 'note',    label: 'Note',    icon: ICON_NOTE },
    { id: 'attivita', label: 'Attività', icon: ICON_ATTIVITA },
    { id: 'misure',   label: 'Misure',   icon: ICON_MISURE },
    { id: 'tema',     label: 'Tema',     icon: ICON_TEMA },
    { id: 'account',  label: 'Account',  icon: ICON_ACCOUNT },
  ].filter(Boolean)

  // Sub-tab Test (solo se hasBia)
  const testTabs = [
    { id: 'fisici', label: 'Fisici', icon: ICON_FISICI, color: displayColor },
    profile.hasBia && { id: 'bia', label: 'BIA', icon: ICON_BIA_SUB, color: displayColor },
  ].filter(Boolean)

  function handleTabChange(id) {
    if (id === activeTab) { setActiveTab('home'); return }
    setActiveTab(id)
    if (id === 'profilo' && !profiloTabs.find(t => t.id === profiloTab)) {
      setProfiloTab('avatar')
    }
  }

  const isHome = activeTab === 'home'

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: isHome ? 0 : 62 }}>

      {/* ── Nav: mobile fixed bottom + desktop sticky top ────────────────── */}
      {/* Deve stare PRIMA del contenuto: sticky top-0 funziona solo se è il primo elemento */}
      <ClientBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        color={displayColor}
        client={client}
        orgId={orgId}
        unreadCount={unreadCount}
        onOpenNotifs={onOpenNotifs}
      />

      {/* ── Hub (pentagono) ──────────────────────────────────────────────── */}
      {isHome && (
        <ClientHub
          client={client}
          orgId={orgId}
          color={displayColor}
          rankObj={rankObj}
          onTabChange={handleTabChange}
        />
      )}

      {/* ── Contenuto sezione ────────────────────────────────────────────── */}
      {!isHome && (
        <div key={activeTab} className="rx-animate-in flex flex-col flex-1">

          {/* Test (Fisici + BIA) ────────────────────────────────────────── */}
          {activeTab === 'test' && (
            <>
              {/* Sub-tab bar interna — visibile solo se hasBia */}
              {testTabs.length > 1 && (
                <SubTabBar
                  tabs={testTabs}
                  active={testTab}
                  onSelect={setTestTab}
                  stickyClass="sticky top-0 lg:top-[52px]"
                />
              )}

              {/* Fisici */}
              {testTab === 'fisici' && (
                <section className="px-4 pt-6 pb-10 flex flex-col gap-4">
                  <div className="rounded-[4px] p-5 rx-card">
                    <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: displayColor }}>
                      ◈ Status
                    </div>
                    <StatsSection
                      stats={client.stats} prevStats={prevStats}
                      color={displayColor} categoria={client.categoria}
                      pentagonSize={160} rankObj={rankObj}
                    />
                  </div>
                  {(client.campionamenti?.length ?? 0) > 0 && (
                    <StatsChart campionamenti={client.campionamenti} color={displayColor} categoria={client.categoria} />
                  )}
                </section>
              )}

              {/* BIA */}
              {testTab === 'bia' && profile.hasBia && (
                <section className="px-4 pt-6 flex flex-col gap-4">
                  <BiaSummary
                    bia={client.lastBia}
                    prevBia={client.biaHistory?.[1] ?? null}
                    sex={client.sesso}
                    age={age}
                    color={displayColor}
                  />
                  {(client.biaHistory?.length ?? 0) > 1 && (
                    <BiaHistoryChart biaHistory={client.biaHistory} color={displayColor} />
                  )}
                </section>
              )}
            </>
          )}

          {/* Trofei ──────────────────────────────────────────────────────── */}
          {activeTab === 'trofei' && (
            <TrophiesSection
              rawBadges={rawBadges}
              earnedBadges={earnedBadges}
              allBadges={allBadges}
              showcase={client.badgeShowcase ?? []}
              readonly
              badgeProgress={badgeProgress}
              color={displayColor}
              onUpdateShowcase={handleUpdateShowcase}
            />
          )}

          {/* Calendario ──────────────────────────────────────────────────── */}
          {activeTab === 'calendario' && (
            <section className="px-4 pt-6 pb-10">
              <div className="rounded-[4px] p-5 rx-card">
                <div className="font-display text-[10px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--rx-green)' }}>
                  ◈ Calendario allenamenti
                </div>
                <ClientCalendar clientId={clientId} orgId={orgId} />
              </div>
            </section>
          )}

          {/* Scheda ──────────────────────────────────────────────────────── */}
          {activeTab === 'scheda' && (
            <ClientWorkoutSection orgId={orgId} clientId={clientId} color={displayColor} />
          )}

          {/* Profilo ─────────────────────────────────────────────────────── */}
          {activeTab === 'profilo' && (
            <div className="flex flex-col flex-1">

              <SubTabBar
                tabs={profiloTabs.map(t => ({ ...t, color: displayColor }))}
                active={profiloTab}
                onSelect={setProfiloTab}
                stickyClass="sticky top-0 lg:top-[52px]"
              />

              <div key={profiloTab} className="rx-animate-in flex-1">

                {profiloTab === 'avatar' && (
                  <AvatarPicker client={client} clientId={clientId} orgId={orgId} color={displayColor} />
                )}

                {profiloTab === 'note' && orgId && (
                  <NotesSection orgId={orgId} clientId={clientId} color={displayColor}
                    author={{ role: 'client', name: client.name }} />
                )}

                {profiloTab === 'attivita' && (
                  <section className="px-4 pt-6 pb-10 flex flex-col gap-4">
                    <XPTrendChart log={client.log ?? []} color={displayColor} />
                    <ActivityLog log={client.log} color={displayColor} />
                  </section>
                )}

                {profiloTab === 'misure' && (
                  <MisureSection client={client} color={displayColor} readonly />
                )}

                {profiloTab === 'tema' && (
                  <div className="px-4 pt-6 pb-10 max-w-xl mx-auto w-full flex flex-col gap-4">
                    <div className="rounded-[4px] p-5 rx-card">
                      <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: 'var(--rx-green)' }}>
                        ◈ Tema interfaccia
                      </div>
                      <ThemePicker />
                    </div>

                    {/* Colore interfaccia */}
                    <div className="rounded-[4px] p-5 rx-card">
                      <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase mb-1" style={{ color: 'var(--rx-green)' }}>
                        ◈ Colore interfaccia
                      </div>
                      <div className="font-body text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        Scegli se i colori dell'interfaccia seguono il tuo rank o il tema selezionato.
                      </div>
                      <div className="flex rounded-[4px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        {[
                          { id: 'rank', label: 'Rank', desc: 'Colore del tuo rank atletico' },
                          { id: 'theme', label: 'Tema', desc: 'Colore primario del tema' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setColorSource(opt.id)}
                            className="flex-1 flex flex-col items-center gap-0.5 py-3 cursor-pointer border-none transition-colors"
                            style={{
                              background: colorSource === opt.id
                                ? 'color-mix(in srgb, var(--rx-green) 12%, transparent)'
                                : 'transparent',
                              borderRight: opt.id === 'rank' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                            }}
                          >
                            <span
                              className="font-display font-bold text-[11px] tracking-[1px]"
                              style={{ color: colorSource === opt.id ? 'var(--rx-green)' : 'rgba(255,255,255,0.35)' }}
                            >
                              {opt.label}
                            </span>
                            <span className="font-body text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                              {opt.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {profiloTab === 'account' && (
                  <div className="px-4 pt-6 pb-10 max-w-xl mx-auto w-full">
                    {/* Card account */}
                    <div className="rounded-[4px] p-5 rx-card mb-4">
                      <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: 'var(--rx-green)' }}>
                        ◈ Account
                      </div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-[4px] flex items-center justify-center flex-shrink-0"
                          style={{ background: displayColor + '20', border: `1px solid ${displayColor}40` }}>
                          <span className="font-display font-black text-xl" style={{ color: displayColor }}>
                            {client.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-display font-black text-white text-sm truncate">{client.name}</div>
                          <div className="font-body text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {client.email ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                      <button
                        onClick={logout}
                        className="font-display flex items-center gap-2.5 w-full cursor-pointer rounded-[4px] transition-colors"
                        style={{
                          padding: '10px 12px', background: 'rgba(248,113,113,0.06)',
                          border: '1px solid rgba(248,113,113,0.18)',
                          fontWeight: 700,
                          fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
                          color: '#f87171',
                        }}
                      >
                        {ICON_LOGOUT}
                        Disconnetti
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
