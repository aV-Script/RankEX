import { useState, useCallback, useEffect, useMemo } from 'react'
import { useClientRank }                    from '../../hooks/useClientRank'
import { useReadonly }                       from '../../context/ReadonlyContext'
import { useTrainerState }                   from '../../context/TrainerContext'
import { StatsSection }                      from '../../components/ui'
import { XPBar }                             from '../../components/ui/XPBar'
import { RankRing }                          from '../../components/ui/RankRing'
import { ActivityLog }                       from '../../components/ui'
import { StatsChart }                        from './StatsChart'
import { DeleteDialog }                      from './client-dashboard/DeleteDialog'
import { NotesSection }                      from './client-dashboard/NotesSection'
import { WorkoutPlanSection }                from './client-dashboard/WorkoutPlanSection'
import { ClientReportPrint }                 from './client-dashboard/ClientReportPrint'
import { ClientCalendar }                    from './ClientCalendar'
import { CampionamentoView }                 from './CampionamentoView'
import { useBia }                            from '../bia/useBia'
import { BiaView }                           from '../bia/BiaView'
import { BiaSummary }                        from '../bia/bia-view/BiaSummary'
import { BiaHistoryChart }                   from '../bia/bia-view/BiaHistoryChart'
import { UpgradeCategoryBanner }             from '../bia/UpgradeCategoryBanner'
import { getProfileCategory }                from '../../constants/bia'
import { getCategoriaById }                  from '../../constants'
import { calcBiaScore, getBiaRankFromScore } from '../../utils/bia'
import { calcAge }                           from '../../utils/validation'
import { getClientSlots }                    from '../../firebase/services/calendar'
import { getMonthRange, calcMonthlyCompletion } from '../calendar/useCalendar'
import { resetPassword }                     from '../../firebase/services/auth'
import { PLAYER_ROLES }                      from '../../config/modules.config'
import { ClientBadges }                      from './ClientBadges'
import { getAuth }                           from 'firebase/auth'
import app                                   from '../../firebase/config'

// ── Icons ─────────────────────────────────────────────────────────────────────

const ICON_TEST = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
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
const ICON_CALENDAR = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
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
 * Dashboard cliente vista trainer — layout:
 *   header full-width (← Clienti | rank | azioni)
 *   ─────────────────────────────────────────────
 *   LEFT panel  │  RIGHT panel
 *   avatar+dati │  stat tiles + tab nav + contenuto
 */
export function ClientDashboard({ client, orgId, onBack, onCampionamento, onDelete }) {
  const { rankObj: testRankObj, color: testColor } = useClientRank(client)
  const { userRole }  = useTrainerState()
  const readonly      = useReadonly()

  const [view,         setView]        = useState('dashboard')
  const [activeTab,    setActiveTab]   = useState(null)
  const [showDelete,   setShowDelete]  = useState(false)
  const [showReport,   setShowReport]  = useState(false)
  const [sessionsData, setSessionsData] = useState(null)
  const [resetState,   setResetState]  = useState('idle')

  useEffect(() => {
    if (!orgId || !client.id) return
    const now = new Date()
    const { from, to } = getMonthRange(now.getFullYear(), now.getMonth() + 1)
    getClientSlots(orgId, client.id, from, to).then(slots => {
      const { planned, completed, pct } = calcMonthlyCompletion(slots, client.id)
      const today    = now.toISOString().slice(0, 10)
      const upcoming = slots
        .filter(s => s.date >= today && s.status === 'planned')
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
      setSessionsData({ planned, completed, pct, upcoming })
    })
  }, [orgId, client.id])

  const { handleSaveBia, handleUpgradeProfile } = useBia()

  const profileType = client.profileType ?? 'tests_only'
  const profile     = getProfileCategory(profileType)

  const biaScore   = calcBiaScore(client.lastBia, client.sesso, calcAge(client.dataNascita))
  const biaRank    = getBiaRankFromScore(biaScore)
  const biaRankObj = biaScore > 0 ? biaRank : { label: 'F', color: '#4a5568' }
  const biaColor   = biaRankObj.color

  const color   = profileType === 'bia_only' ? biaColor : testColor
  const rankObj = profileType === 'bia_only' ? biaRankObj : testRankObj

  const isSoccer    = ['soccer', 'soccer_youth'].includes(client.categoria)
  const categoriaObj = !isSoccer ? getCategoriaById(client.categoria) : null
  const ruoloObj     = isSoccer
    ? PLAYER_ROLES.find(r => r.value === client.ruolo) ?? null
    : null

  const prevStats = client.campionamenti?.[1]?.stats ?? null
  const media     = client.media ?? 0
  const campCount = client.campionamenti?.length ?? 0

  const trainerAuthor = {
    role: userRole,
    name: getAuth(app).currentUser?.email ?? 'Trainer',
  }

  const tabs = useMemo(() => [
    { id: 'avatar',      label: 'Avatar',      mobileLabel: 'Avatar', icon: ICON_AVATAR,   mobileOnly: true },
    profile.hasTests && { id: 'test',        label: 'Test',        mobileLabel: 'Test',   icon: ICON_TEST },
    profile.hasBia   && { id: 'bia',         label: 'BIA',         mobileLabel: 'BIA',    icon: ICON_BIA },
    { id: 'allenamento', label: 'Allenamento', mobileLabel: 'Scheda', icon: ICON_WORKOUT },
    { id: 'calendario',  label: 'Calendario',  mobileLabel: 'Cal.',   icon: ICON_CALENDAR },
    { id: 'note',        label: 'Note',         mobileLabel: 'Note',  icon: ICON_NOTES },
    { id: 'attivita',    label: 'Attività',     mobileLabel: 'Log',   icon: ICON_ACTIVITY },
  ].filter(Boolean), [profile.hasTests, profile.hasBia])

  const defaultTab      = profile.hasTests ? 'test' : profile.hasBia ? 'bia' : 'allenamento'
  const tab             = activeTab ?? (window.innerWidth < 1024 ? 'avatar' : defaultTab)
  const mobileHeaderTop = (!readonly && (profile.hasTests || profile.hasBia)) ? 'top-[80px]' : 'top-[41px]'

  const handleDelete = useCallback(async () => {
    await onDelete(client.id)
    setShowDelete(false)
    onBack()
  }, [onDelete, client.id, onBack])

  const handleSaveCampionamento = useCallback(async (newStats, testValues) => {
    await onCampionamento(client, newStats, testValues)
  }, [onCampionamento, client])

  const handleResetPassword = useCallback(async () => {
    if (!client.email || resetState === 'loading') return
    setResetState('loading')
    try {
      await resetPassword(client.email)
      setResetState('sent')
      setTimeout(() => setResetState('idle'), 4000)
    } catch {
      setResetState('error')
      setTimeout(() => setResetState('idle'), 3000)
    }
  }, [client.email, resetState])

  // ── Views overlay ─────────────────────────────────────────────────────────
  if (view === 'campionamento') {
    return (
      <CampionamentoView
        client={client}
        color={color}
        onSave={handleSaveCampionamento}
        onBack={() => setView('dashboard')}
      />
    )
  }
  if (view === 'bia') {
    return (
      <BiaView
        client={client}
        color={color}
        onSave={(biaData) => handleSaveBia(client, biaData)}
        onBack={() => setView('dashboard')}
      />
    )
  }

  return (
    <div className="min-h-screen text-white flex flex-col">

      {/* ── HEADER FULL-WIDTH ─────────────────────────────────────────────── */}
      <header className="border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md shrink-0">

        {/* ── Mobile: riga 1 — navigazione ──────────────────────────────────── */}
        <div className="flex lg:hidden items-center px-4 py-2.5 gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors cursor-pointer bg-transparent border-none shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span className="font-display text-[10px] tracking-[1.5px]">CLIENTI</span>
          </button>
          <div className="flex-1 text-center font-display font-black text-[13px] tracking-wide text-white truncate px-2">
            {client.name}
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="shrink-0 bg-transparent border-none cursor-pointer p-1 text-white/30 hover:text-white/60 transition-colors"
            title="Esporta PDF"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
          </button>
        </div>

        {/* ── Mobile: riga 2 — azioni principali ────────────────────────────── */}
        {!readonly && (profile.hasTests || profile.hasBia) && (
          <div className="flex lg:hidden items-center gap-1.5 px-4 pb-2.5">
            {profile.hasTests && (
              <button
                onClick={() => setView('campionamento')}
                className="flex-1 border rounded-[3px] px-3 py-2 font-display text-[10px] tracking-[1px] cursor-pointer transition-all hover:opacity-80 text-center"
                style={{ color, borderColor: color + '55', background: color + '14' }}
              >
                CAMPIONAMENTO
              </button>
            )}
            {profile.hasBia && (
              <button
                onClick={() => setView('bia')}
                className="flex-1 border rounded-[3px] px-3 py-2 font-display text-[10px] tracking-[1px] cursor-pointer transition-all hover:opacity-80 text-center"
                style={{ color: biaColor, borderColor: biaColor + '55', background: biaColor + '14' }}
              >
                BIA
              </button>
            )}
            <button
              onClick={() => setShowDelete(true)}
              className="border border-red-500/20 rounded-[3px] px-3 py-2 text-red-400/50 font-display text-[10px] cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all bg-transparent"
              title="Elimina cliente"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Desktop: riga unica — azioni compatte a destra ────────────────── */}
        <div className="hidden lg:flex items-center justify-end gap-1.5 px-5 py-3">
          {!readonly && profile.hasTests && (
            <button
              onClick={() => setView('campionamento')}
              className="border rounded-[3px] px-2.5 py-1.5 font-display text-[10px] cursor-pointer transition-all hover:opacity-80"
              style={{ color, borderColor: color + '55', background: color + '14' }}
            >
              CAMPIONAMENTO
            </button>
          )}
          {!readonly && profile.hasBia && (
            <button
              onClick={() => setView('bia')}
              className="border rounded-[3px] px-2.5 py-1.5 font-display text-[10px] cursor-pointer transition-all hover:opacity-80"
              style={{ color: biaColor, borderColor: biaColor + '55', background: biaColor + '14' }}
            >
              BIA
            </button>
          )}
          <button
            onClick={() => setShowReport(true)}
            className="bg-transparent border rounded-[3px] px-2.5 py-1.5 font-display text-[10px] cursor-pointer transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(200,212,224,0.45)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(200,212,224,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,212,224,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            PDF
          </button>
          <button
            onClick={handleResetPassword}
            disabled={resetState === 'loading' || resetState === 'sent'}
            className="bg-transparent border rounded-[3px] px-2.5 py-1.5 font-display text-[10px] cursor-pointer transition-all disabled:opacity-50"
            style={resetState === 'sent'
              ? { borderColor: 'rgba(15,214,90,0.4)', color: '#0fd65a' }
              : resetState === 'error'
              ? { borderColor: 'rgba(248,113,113,0.4)', color: '#f87171' }
              : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(200,212,224,0.45)' }
            }
          >
            {resetState === 'loading' ? 'INVIO…'
             : resetState === 'sent'  ? '✓ INVIATA'
             : resetState === 'error' ? 'ERRORE'
             : 'RESET PW'}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="bg-transparent border border-red-500/20 rounded-[3px] px-2.5 py-1.5 text-red-400/50 font-display text-[10px] cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all"
          >
            ELIMINA
          </button>
        </div>

      </header>

      {/* ── BODY: 2 colonne ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <aside
          className="shrink-0 lg:w-2/5"
        >
          {/* Desktop: sticky, centrata verticalmente nell'area visibile */}
          <div className="hidden lg:flex lg:items-center sticky top-[49px] h-[calc(100vh-49px)]">
            <section className="px-4 py-6 w-full">
              <div className="rounded-[4px] p-5 rx-card flex flex-col items-center text-center">

                {/* Header card — come Status */}
                <div className="w-full flex items-center justify-between mb-5">
                  <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase" style={{ color: '#0fd65a' }}>◈ Atleta</div>
                </div>

                {/* Avatar */}
                <AvatarPlaceholder
                  color={color}
                  rankObj={rankObj}
                  xp={client.xp}
                  xpNext={client.xpNext}
                  level={client.level}
                  biaRankObj={profileType === 'complete' ? biaRankObj : null}
                />

                {/* Nome */}
                <div className="mt-3 font-display font-black text-[24px] text-white leading-tight tracking-wide uppercase">
                  {client.name}
                </div>

                {/* Badge categoria / ruolo */}
                <ClientBadges
                  categoriaObj={categoriaObj}
                  ruoloObj={ruoloObj}
                  color={color}
                  categoria={client.categoria}
                  hasTests={profile.hasTests}
                  hasBia={profile.hasBia}
                  rankObj={testRankObj}
                  biaRankObj={biaRankObj}
                />

                {/* XP Bar — self-stretch forza larghezza piena nonostante items-center */}
                <div className="mt-5 self-stretch">
                  <XPBar xp={client.xp} xpNext={client.xpNext} color={color} fullWidth />
                </div>

              </div>
            </section>
          </div>
        </aside>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 lg:pt-8">

          {/* Banner upgrade */}
          <div className="px-4 pt-3">
            <UpgradeCategoryBanner
              client={client}
              color={color}
              onUpgrade={handleUpgradeProfile}
            />
          </div>

          {/* Banner educativo — solo al primo campionamento */}
          {campCount === 0 && !readonly && profile.hasTests && (
            <div
              className="mx-4 mt-3 px-4 py-3 rounded-[4px] font-body text-[12px] text-white/50 leading-relaxed"
              style={{ background: 'rgba(14,196,82,0.04)', border: '1px solid rgba(14,196,82,0.14)' }}
            >
              <span
                className="font-display text-[9px] tracking-[2px] uppercase mr-2 align-middle"
                style={{ color: '#0ec452' }}
              >
                Inizia
              </span>
              Esegui il primo campionamento per calcolare il rank dell'atleta. Le sessioni chiuse aggiungono XP e fanno salire di livello.
            </div>
          )}

          {/* Tab navigation — rx-card section */}
          <section
            className={`px-4 pt-4 pb-2 sticky ${mobileHeaderTop} lg:top-[49px] z-10 backdrop-blur-md`}
          >
            <div className="rounded-[4px] rx-card overflow-hidden">
              <div className="grid grid-flow-col auto-cols-fr px-1 py-1.5">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-1.5 px-0.5 lg:px-3 py-2.5 rounded-[3px] font-display tracking-[0.5px] cursor-pointer border transition-all${t.mobileOnly ? ' lg:hidden' : ''}`}
                    style={tab === t.id
                      ? { background: color + '18', borderColor: color + '55', color, fontWeight: 700 }
                      : { background: 'transparent', borderColor: 'transparent', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }
                    }
                  >
                    {t.icon}
                    <span className="text-[9px] leading-none lg:hidden">{t.mobileLabel}</span>
                    <span className="hidden lg:inline text-[11px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Contenuto tab */}
          <div className="flex-1 pb-12">
          <div key={tab} className="rx-animate-in">

            {tab === 'avatar' && (
              <section className="px-4 pt-6 lg:hidden">
                <div className="rounded-[4px] p-5 rx-card flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between mb-5">
                    <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase" style={{ color: '#0fd65a' }}>◈ Atleta</div>
                  </div>
                  <AvatarPlaceholder color={color} rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} level={client.level} small />
                  <div className="mt-3 font-display font-black text-[24px] text-white leading-tight tracking-wide uppercase">
                    {client.name}
                  </div>
                  <ClientBadges
                    categoriaObj={categoriaObj}
                    ruoloObj={ruoloObj}
                    color={color}
                    categoria={client.categoria}
                    hasTests={profile.hasTests}
                    hasBia={profile.hasBia}
                    rankObj={testRankObj}
                    biaRankObj={biaRankObj}
                  />
                  <div className="mt-5 self-stretch">
                    <XPBar xp={client.xp} xpNext={client.xpNext} color={color} fullWidth />
                  </div>
                </div>
              </section>
            )}

            {tab === 'test' && profile.hasTests && (
              <section className="px-4 pt-6">
                <div className="rounded-[4px] p-5 rx-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase" style={{ color: '#0fd65a' }}>◈ Status</div>
                    {!readonly && (
                      <button onClick={() => setView('campionamento')}
                        className="text-[11px] font-display px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all hover:opacity-80"
                        style={{ color, borderColor: color + '55', background: color + '11' }}>
                        CAMPIONAMENTO
                      </button>
                    )}
                  </div>
                  <div className="rounded-[4px] p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <StatsSection stats={client.stats} prevStats={prevStats} color={color} categoria={client.categoria} />
                  </div>
                  <div className="mt-6">
                    <StatsChart campionamenti={client.campionamenti} color={color} categoria={client.categoria} />
                  </div>
                </div>
              </section>
            )}

            {tab === 'bia' && profile.hasBia && (
              <section className="px-4 pt-6">
                <div className="rounded-[4px] p-5 rx-card">
                  <div className="font-display text-[10px] tracking-[3px] uppercase mb-4" style={{ color: '#0fd65a' }}>◈ BIA</div>
                  <BiaSummary bia={client.lastBia} prevBia={client.biaHistory?.[1] ?? null} sex={client.sesso} age={calcAge(client.dataNascita)} color={biaColor} rank={biaRank.label} />
                  <div className="mt-6">
                    <BiaHistoryChart biaHistory={client.biaHistory} color={biaColor} />
                  </div>
                </div>
              </section>
            )}

            {tab === 'allenamento' && (
              <WorkoutPlanSection orgId={orgId} clientId={client.id} color={color} readonly={readonly} />
            )}

            {tab === 'calendario' && (
              <section className="px-4 pt-6">
                <div className="rounded-[4px] p-5 rx-card">
                  <div className="font-display text-[10px] tracking-[3px] uppercase mb-4" style={{ color: '#0fd65a' }}>◈ Calendario allenamenti</div>
                  <ClientCalendar clientId={client.id} orgId={orgId} />
                </div>
              </section>
            )}

            {tab === 'note' && (
              <NotesSection orgId={orgId} clientId={client.id} color={color} author={trainerAuthor} readonly={readonly} />
            )}

            {tab === 'attivita' && (
              <section className="px-4 pt-6">
                <ActivityLog log={client.log} color={color} limit={10} />
              </section>
            )}

          </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteDialog clientName={client.name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}
      {showReport && (
        <ClientReportPrint client={client} color={color} rankObj={rankObj} onClose={() => setShowReport(false)} />
      )}
    </div>
  )
}

// ── AvatarPlaceholder ─────────────────────────────────────────────────────────

/**
 * Placeholder dell'avatar atleta — verrà sostituito dall'avatar reale.
 * Mostra una silhouette stilizzata con il RankRing come badge.
 *
 * Props:
 *   compact    — versione mini per mobile (solo ring senza card)
 *   biaRankObj — se presente, mostra un chip BIA rank
 */
function AvatarPlaceholder({ color, rankObj, xp, xpNext, level, biaRankObj, compact = false, small = false }) {
  if (compact) {
    return <RankRing rankObj={rankObj} xp={xp} xpNext={xpNext} size={72} animated={false} />
  }

  const W = small ? 110 : 174
  const H = small ? 138 : 218

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

        {/* Badge livello — angolo top-left */}
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



