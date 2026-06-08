import { useState, useCallback, useMemo } from 'react'
import { useClientRank }                    from '../../hooks/useClientRank'
import { useReadonly }                       from '../../context/ReadonlyContext'
import { useTrainerState }                   from '../../context/TrainerContext'
import { StatsSection }                      from '../../components/ui'
import { XPBar }                             from '../../components/ui/XPBar'
import { ActivityLog }                       from '../../components/ui'
import { StatsChart }                        from './StatsChart'
import { DeleteDialog }                      from './client-dashboard/DeleteDialog'
import { NotesSection }                      from './client-dashboard/NotesSection'
import { WorkoutPlanSection }                from './client-dashboard/WorkoutPlanSection'
import { ClientReportPrint }                 from './client-dashboard/ClientReportPrint'
import { ClientCalendar }                    from './ClientCalendar'
import { CampionamentoView }                 from './CampionamentoView'
import { useBia }                            from '../bia/useBia'
import { useMisure }                         from './useMisure'
import { XPTrendChart }                      from './client-dashboard/XPTrendChart'
import { MisureSection }                     from './client-dashboard/MisureSection'
import { WearableSection }                   from './client-dashboard/WearableSection'
import { BiaView }                           from '../bia/BiaView'
import { BiaSummary }                        from '../bia/bia-view/BiaSummary'
import { BiaHistoryChart }                   from '../bia/bia-view/BiaHistoryChart'
import { UpgradeCategoryBanner }             from '../bia/UpgradeCategoryBanner'
import { getProfileCategory }                from '../../constants/bia'
import { getCategoriaById }                  from '../../constants'
import { calcBiaScore, getBiaRankFromScore } from '../../utils/bia'
import { calcAge }                           from '../../utils/validation'
import { resetPassword }                     from '../../firebase/services/auth'
import { PLAYER_ROLES }                      from '../../config/modules.config'
import { SoccerAvatar }                       from './client-view/avatar/SoccerAvatar'
import { TrophiesSection }                   from './client-dashboard/TrophiesSection'
import { useBadges }                         from '../../hooks/useBadges'
import { useRegisterContextMenu }            from '../../context/NavMenuContext'
import { getAuth }                           from 'firebase/auth'
import app                                   from '../../firebase/config'
import { PrintPickerModal }                  from '../../components/common/PrintPickerModal'

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
const ICON_WEARABLE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const ICON_TROFEI = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
const ICON_MISURE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v1M6.2 6.2l.7.7M17.8 6.2l-.7.7M3 13h18M5 13a7 7 0 0 1 14 0"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>
)
const ICON_BACK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ICON_CAMPIONAMENTO = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)
const ICON_BIA_REC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    <line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/>
  </svg>
)
const ICON_PDF = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <polyline points="9 15 12 18 15 15"/>
  </svg>
)
const ICON_RESET_PW = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const ICON_DELETE_CLIENT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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
  const [showDelete,      setShowDelete]      = useState(false)
  const [showReport,      setShowReport]      = useState(false)
  const [showPrintPicker, setShowPrintPicker] = useState(false)
  const [printMode,       setPrintMode]       = useState('dark')
  const [showActions,     setShowActions]     = useState(false)
  const [resetState,   setResetState]  = useState('idle')

  const { handleSaveBia, handleUpgradeProfile } = useBia()
  const { handleUpdateMisure }                  = useMisure()

  const trainerUid = getAuth(app).currentUser?.uid ?? 'trainer'
  const { earnedBadges, allBadges, rawBadges, badgeProgress, handleAwardManual, handleRevoke, handleUpdateShowcase } =
    useBadges(orgId, client.id, client, { readonly })

  const profileType = client.profileType ?? 'tests_only'
  const profile     = getProfileCategory(profileType)

  const biaScore   = calcBiaScore(client.lastBia, client.sesso, calcAge(client.dataNascita))
  const biaRank    = getBiaRankFromScore(biaScore)
  const biaRankObj = biaScore > 0 ? biaRank : { label: 'F', color: '#4a5568' }
  const rankObj = profileType === 'bia_only' ? biaRankObj : testRankObj

  const isSoccer    = ['soccer', 'soccer_youth', 'soccer_junior'].includes(client.categoria)
  const categoriaObj = !isSoccer ? getCategoriaById(client.categoria) : null
  const ruoloObj     = isSoccer
    ? PLAYER_ROLES.find(r => r.value === client.ruolo) ?? null
    : null

  const prevStats = client.campionamenti?.[1]?.stats ?? null
  const campCount = client.campionamenti?.length ?? 0

  const trainerAuthor = {
    role: userRole,
    name: getAuth(app).currentUser?.email ?? 'Trainer',
  }

  const contextItems = useMemo(() => [
    { id: '__back__',    label: 'Clienti',     icon: ICON_BACK },
    { id: 'atleta',      label: 'Atleta',      icon: ICON_AVATAR },
    profile.hasTests && { id: 'test',        label: 'Test',        icon: ICON_TEST },
    { id: 'bia',         label: 'BIA',         icon: ICON_BIA },
    { id: 'allenamento', label: 'Allenamento', icon: ICON_WORKOUT },
    { id: 'calendario',  label: 'Calendario',  icon: ICON_CALENDAR },
    { id: 'note',        label: 'Note',        icon: ICON_NOTES },
    { id: 'attivita',    label: 'Attività',    icon: ICON_ACTIVITY },
    { id: 'misure',      label: 'Misure',      icon: ICON_MISURE },
    { id: 'wearable',    label: 'Wearable',    icon: ICON_WEARABLE },
    !readonly && profile.hasTests && { id: '__campionamento__', label: 'Campionam.', icon: ICON_CAMPIONAMENTO },
    !readonly && profile.hasBia   && { id: '__bia_rec__',       label: 'Nuova BIA',  icon: ICON_BIA_REC },
    { id: '__pdf__',      label: 'PDF',       icon: ICON_PDF },
    client.email && { id: '__reset_pw__', label: 'Reset PW',  icon: ICON_RESET_PW },
    { id: '__delete__',   label: 'Elimina',   icon: ICON_DELETE_CLIENT, isDanger: true },
  ].filter(Boolean), [profile.hasTests, profile.hasBia, readonly, client.email])

  const defaultTab = 'atleta'
  const tab        = activeTab ?? defaultTab

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

  const handleContextNav = useCallback((id) => {
    if      (id === '__back__')          onBack()
    else if (id === '__campionamento__') setView('campionamento')
    else if (id === '__bia_rec__')       setView('bia')
    else if (id === '__pdf__')           setShowPrintPicker(true)
    else if (id === '__reset_pw__')      handleResetPassword()
    else if (id === '__delete__')        setShowDelete(true)
    else                                 setActiveTab(id)
  }, [handleResetPassword, onBack])

  useRegisterContextMenu('Atleta', contextItems, tab, handleContextNav)

  return (
    <div className="min-h-screen text-white flex flex-col">

      {/* ── Header + tab bar — riga unica ─────────────────────────────────────── */}
      <header
        className="border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md shrink-0 flex items-stretch"
        style={{ background: 'var(--rx-nav-bg)', height: 44 }}
      >
        {/* ← Back */}
        <button
          onClick={onBack}
          aria-label="Torna ai clienti"
          className="w-10 flex items-center justify-center shrink-0 bg-transparent border-none text-white/40 hover:text-white/70 transition-colors cursor-pointer"
        >
          {ICON_BACK}
        </button>

        {/* Tab bar */}
        <div className="flex-1 relative overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center justify-center h-full min-w-full w-fit">
            {[
              { id: 'atleta',      label: 'Atleta',      icon: ICON_AVATAR },
              profile.hasTests && { id: 'test',        label: 'Test',        icon: ICON_TEST },
              { id: 'bia',         label: 'BIA',         icon: ICON_BIA },
              { id: 'allenamento', label: 'Allenamento', icon: ICON_WORKOUT },
              { id: 'calendario',  label: 'Calendario',  icon: ICON_CALENDAR },
              { id: 'note',        label: 'Note',        icon: ICON_NOTES },
              { id: 'attivita',    label: 'Attività',    icon: ICON_ACTIVITY },
              { id: 'misure',      label: 'Misure',      icon: ICON_MISURE },
              { id: 'wearable',    label: 'Wearable',    icon: ICON_WEARABLE },
              { id: 'trofei',      label: 'Trofei',      icon: ICON_TROFEI },
            ].filter(Boolean).map(t => (
              <button
                key={t.id}
                onClick={() => { setView('dashboard'); setActiveTab(t.id) }}
                aria-current={tab === t.id ? 'page' : undefined}
                className="flex items-center gap-1.5 px-3 h-full shrink-0 cursor-pointer border-none bg-transparent relative transition-colors"
                style={{ color: tab === t.id ? 'var(--rx-green)' : 'rgba(200,212,224,0.35)' }}
              >
                {tab === t.id && (
                  <div
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-sm"
                    style={{ background: 'var(--rx-gradient)', boxShadow: '0 0 6px var(--rx-green-glow)' }}
                  />
                )}
                <span style={{ display: 'flex', filter: tab === t.id ? 'drop-shadow(0 0 4px var(--rx-green-glow))' : 'none' }}>
                  {t.icon}
                </span>
                <span className="font-display text-[9px] tracking-[1px] uppercase whitespace-nowrap">{t.label}</span>
              </button>
            ))}
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

        {/* Divisore */}
        <div className="w-px self-stretch my-2" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* ⋮ Overflow actions */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowActions(v => !v)}
            aria-label="Azioni"
            className="w-10 h-full flex items-center justify-center bg-transparent border-none text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>
            </svg>
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[168px] py-1 rounded-[4px]"
                style={{ background: 'var(--rx-surface)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
              >
                <button onClick={() => { setShowActions(false); setShowPrintPicker(true) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[.04] transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase">
                  {ICON_PDF} Esporta PDF
                </button>
                {client.email && (
                  <button onClick={() => { setShowActions(false); handleResetPassword() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[.04] transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase">
                    {ICON_RESET_PW} Reset password
                  </button>
                )}
                <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <button onClick={() => { setShowActions(false); setShowDelete(true) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-900/20 transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase"
                  style={{ color: '#f87171' }}>
                  {ICON_DELETE_CLIENT} Elimina
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      {view === 'campionamento' && (
        <CampionamentoView
          client={client}
          color="var(--rx-green)"
          onSave={handleSaveCampionamento}
          onBack={() => setView('dashboard')}
        />
      )}
      {view === 'bia' && (
        <BiaView
          client={client}
          color="var(--rx-green)"
          onSave={(biaData) => handleSaveBia(client, biaData)}
          onBack={() => setView('dashboard')}
        />
      )}
      <div className={`flex-1 flex flex-col min-w-0 ${view !== 'dashboard' ? 'hidden' : ''}`}>

        {/* Banner upgrade — solo per bia_only (manca i test); il caso tests_only è gestito nel tab BIA */}
        {profileType === 'bia_only' && (
          <div className="px-4 pt-3">
            <UpgradeCategoryBanner client={client} color="var(--rx-green)" onUpgrade={handleUpgradeProfile} />
          </div>
        )}

        {/* Banner primo campionamento */}
        {campCount === 0 && !readonly && profile.hasTests && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-[4px] font-body text-[12px] text-white/50 leading-relaxed"
            style={{ background: 'color-mix(in srgb, var(--rx-green) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-green) 14%, transparent)' }}
          >
            <span className="font-display text-[9px] tracking-[2px] uppercase mr-2 align-middle" style={{ color: 'var(--rx-green)' }}>
              Inizia
            </span>
            Esegui il primo campionamento per calcolare il rank dell'atleta. Le sessioni chiuse aggiungono XP e fanno salire di livello.
          </div>
        )}

        {/* Contenuto tab */}
        <div className="flex-1 pb-24">
        <div key={tab} className="rx-animate-in">

          {tab === 'atleta' && (() => {
            const av        = client.avatar ?? {}
            const mediaVal  = client.media != null ? Math.round(client.media) : null
            const roleLabel = ruoloObj?.label ?? categoriaObj?.label ?? null

            return (
              <section className="p-4">

                {/* Card atleta — tutto dentro */}
                <div className="rx-card rounded-[4px] overflow-hidden">
                  <div className="h-[2px]" style={{ background: 'var(--rx-gradient)' }} />

                  {/* Avatar + Info */}
                  <div className="flex items-center gap-4 px-4 pt-4 pb-3">

                    {/* Avatar — quadrato, DiceBear gestisce il cerchio internamente */}
                    <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                      <SoccerAvatar
                        color="var(--rx-green)" width={80} height={80}
                        skinTone={av.skinTone} hairColor={av.hairColor} hairStyle={av.hairStyle}
                        expression={av.expression} accessory={av.accessory} clothing={av.clothing}
                        jerseyColor={av.jerseyColor} facialHair={av.facialHair}
                        facialHairColor={av.facialHairColor} clothingGraphic={av.clothingGraphic}
                        hatColor={av.hatColor} accessoriesColor={av.accessoriesColor}
                      />
                      {/* Ring colorato sopra */}
                      <div className="absolute inset-0 rounded-full pointer-events-none"
                        style={{ border: '2px solid color-mix(in srgb, var(--rx-green) 33%, transparent)', boxSizing: 'border-box' }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      {roleLabel && (
                        <span className="font-display text-[9px] font-bold tracking-[2px] uppercase"
                          style={{ color: 'var(--rx-green)' }}>{roleLabel}</span>
                      )}
                      <div className="font-display font-black text-white text-[17px] uppercase truncate leading-tight">
                        {client.name}
                      </div>
                      <div className="flex items-end gap-4 mt-1">
                        <div>
                          <div className="font-display font-black leading-none"
                            style={{ fontSize: 38, color: campCount > 0 ? 'var(--rx-green)' : 'rgba(255,255,255,0.15)' }}>
                            {campCount > 0 ? (rankObj?.label ?? 'F') : '—'}
                          </div>
                          <div className="font-display text-[8px] font-bold tracking-[2px] uppercase"
                            style={{ color: 'rgba(255,255,255,0.25)' }}>RANK</div>
                        </div>
                        <div>
                          <div className="font-display font-black text-[22px] text-white leading-none">{client.level ?? 1}</div>
                          <div className="font-display text-[8px] font-bold tracking-[2px] uppercase"
                            style={{ color: 'rgba(255,255,255,0.25)' }}>LV.</div>
                        </div>
                        {campCount > 0 && mediaVal != null && (
                          <div className="ml-auto">
                            <div className="font-display font-black text-[22px] leading-none" style={{ color: 'var(--rx-green)' }}>{mediaVal}°</div>
                            <div className="font-display text-[8px] font-bold tracking-[2px] uppercase"
                              style={{ color: 'rgba(255,255,255,0.25)' }}>MEDIA</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* XP bar */}
                  <div className="px-4 pb-4">
                    <XPBar xp={client.xp} xpNext={client.xpNext} color="var(--rx-green)" size="sm" fullWidth />
                  </div>

                  {/* Stats strip — dentro la stessa card */}
                  <div className="flex" style={{ borderTop: '1px solid var(--border-default)' }}>
                    {[
                      { label: 'Campionamenti', value: campCount },
                      { label: 'Sessioni / sett.', value: client.sessionsPerWeek ?? '—' },
                      profileType !== 'tests_only' && { label: 'BIA', value: biaRankObj?.label ?? '—' },
                    ].filter(Boolean).map((s, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center py-4"
                        style={{ borderLeft: i > 0 ? '1px solid var(--border-default)' : 'none' }}>
                        <span className="font-display font-black text-[18px] text-white leading-none">{s.value}</span>
                        <span className="font-display text-[8px] font-semibold tracking-[1.5px] uppercase mt-1.5"
                          style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </section>
            )
          })()}

          {tab === 'test' && profile.hasTests && (
            <section className="px-4 pt-6">
              <div className="rounded-[4px] p-5 rx-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase" style={{ color: 'var(--rx-green)' }}>◈ Status</div>
                  {!readonly && (
                    <button
                      onClick={() => setView('campionamento')}
                      className="font-display text-[10px] tracking-[1px] px-3 py-1.5 rounded-[3px] border cursor-pointer transition-all"
                      style={{ color: 'var(--rx-green)', borderColor: 'color-mix(in srgb, var(--rx-green) 33%, transparent)', background: 'color-mix(in srgb, var(--rx-green) 7%, transparent)' }}
                    >
                      + CAMPIONAMENTO
                    </button>
                  )}
                </div>
                <StatsSection stats={client.stats} prevStats={prevStats} color="var(--rx-green)" categoria={client.categoria} pentagonSize={160} rankObj={rankObj} />
                {(client.campionamenti?.length ?? 0) > 0 && (
                  <div className="mt-6">
                    <StatsChart campionamenti={client.campionamenti} color="var(--rx-green)" categoria={client.categoria} />
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === 'bia' && (
            profile.hasBia ? (
              <section className="px-4 pt-6">
                <div className="rounded-[4px] p-5 rx-card flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-[10px] tracking-[3px] uppercase" style={{ color: 'var(--rx-green)' }}>◈ BIA</div>
                    {!readonly && (
                      <button
                        onClick={() => setView('bia')}
                        className="font-display text-[10px] tracking-[1px] px-3 py-1.5 rounded-[3px] border cursor-pointer transition-all"
                        style={{ color: 'var(--rx-green)', borderColor: 'color-mix(in srgb, var(--rx-green) 33%, transparent)', background: 'color-mix(in srgb, var(--rx-green) 7%, transparent)' }}
                      >
                        + RILEVAMENTO
                      </button>
                    )}
                  </div>
                  <BiaSummary bia={client.lastBia} prevBia={client.biaHistory?.[1] ?? null} sex={client.sesso} age={calcAge(client.dataNascita)} color="var(--rx-green)" rank={biaRank.label} />
                  <BiaHistoryChart biaHistory={client.biaHistory} color="var(--rx-green)" />
                </div>
              </section>
            ) : (
              <div className="px-4 pt-6">
                <UpgradeCategoryBanner client={client} color="var(--rx-green)" onUpgrade={handleUpgradeProfile} />
              </div>
            )
          )}

          {tab === 'allenamento' && (
            <WorkoutPlanSection orgId={orgId} clientId={client.id} color="var(--rx-green)" readonly={readonly} />
          )}

          {tab === 'calendario' && (
            <section className="px-4 pt-6">
              <div className="rounded-[4px] p-5 rx-card">
                <div className="font-display text-[10px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--rx-green)' }}>◈ Calendario allenamenti</div>
                <ClientCalendar clientId={client.id} orgId={orgId} />
              </div>
            </section>
          )}

          {tab === 'note' && (
            <NotesSection orgId={orgId} clientId={client.id} color="var(--rx-green)" author={trainerAuthor} readonly={readonly} />
          )}

          {tab === 'attivita' && (
            <section className="px-4 pt-6 flex flex-col gap-4">
              <XPTrendChart log={client.log ?? []} color="var(--rx-green)" />
              <ActivityLog log={client.log} color="var(--rx-green)" limit={10} />
            </section>
          )}

          {tab === 'misure' && (
            <MisureSection client={client} color="var(--rx-green)" isSoccer={isSoccer} readonly={readonly} onUpdate={handleUpdateMisure} />
          )}

          {tab === 'wearable' && (
            <WearableSection client={client} orgId={orgId} color="var(--rx-green)" />
          )}

          {tab === 'trofei' && (
            <TrophiesSection
              rawBadges={rawBadges}
              earnedBadges={earnedBadges}
              allBadges={allBadges}
              showcase={client.badgeShowcase ?? []}
              readonly={readonly}
              badgeProgress={badgeProgress}
              color="var(--rx-green)"
              onAward={(badgeId, note) => handleAwardManual(badgeId, trainerUid, note)}
              onRevoke={handleRevoke}
              onUpdateShowcase={handleUpdateShowcase}
            />
          )}

        </div>
        </div>
      </div>


      {showDelete && (
        <DeleteDialog clientName={client.name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}
      {showPrintPicker && (
        <PrintPickerModal
          onSelect={(mode) => { setPrintMode(mode); setShowPrintPicker(false); setShowReport(true) }}
          onCancel={() => setShowPrintPicker(false)}
        />
      )}
      {showReport && (
        <ClientReportPrint client={client} color="var(--rx-green)" rankObj={rankObj} mode={printMode} onClose={() => setShowReport(false)} />
      )}
    </div>
  )
}



