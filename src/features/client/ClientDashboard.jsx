import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { useClientRank }                    from '../../hooks/useClientRank'
import { useReadonly }                       from '../../context/ReadonlyContext'
import { useTrainerState }                   from '../../context/TrainerContext'
import { StatsSection }                      from '../../components/ui'
import { ActivityLog }                       from '../../components/ui'
import { StatsChart }                        from './StatsChart'
import { DeleteDialog }                      from './client-dashboard/DeleteDialog'
import { NotesSection }                      from './client-dashboard/NotesSection'
import { WorkoutPlanSection }                from './client-dashboard/WorkoutPlanSection'
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
import { TrophiesSection }                   from './client-dashboard/TrophiesSection'
import { useBadges }                         from '../../hooks/useBadges'
import { useRegisterContextMenu }            from '../../context/NavMenuContext'
import { getAuth }                           from 'firebase/auth'
import app                                   from '../../firebase/config'
import { PrintPickerModal }                  from '../../components/common/PrintPickerModal'
import { ClientDashboardHeader }             from './client-dashboard/ClientDashboardHeader'
import { AtletaTab }                         from './client-dashboard/AtletaTab'
import { ErrorBoundary }                     from '../../components/common/ErrorBoundary'
import { ChartErrorFallback }                from '../../components/common/ChartErrorFallback'
import {
  ICON_TEST, ICON_BIA, ICON_WORKOUT, ICON_CALENDAR, ICON_NOTES, ICON_ACTIVITY,
  ICON_AVATAR, ICON_WEARABLE, ICON_MISURE, ICON_BACK,
  ICON_CAMPIONAMENTO, ICON_BIA_REC, ICON_PDF, ICON_RESET_PW, ICON_DELETE_CLIENT,
} from './client-dashboard/clientDashboardIcons'

// Montato solo dietro il flusso di export PDF — lazy-load per non pesare
// sul bundle iniziale della dashboard cliente.
const ClientReportPrint = lazy(() =>
  import('./client-dashboard/ClientReportPrint').then(m => ({ default: m.ClientReportPrint }))
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

  const handleSelectTab = useCallback((id) => {
    setView('dashboard')
    setActiveTab(id)
  }, [])

  const handleToggleActions = useCallback(() => {
    setShowActions(v => !v)
  }, [])

  const handleExportPdf = useCallback(() => {
    setShowActions(false)
    setShowPrintPicker(true)
  }, [])

  const handleResetPasswordFromMenu = useCallback(() => {
    setShowActions(false)
    handleResetPassword()
  }, [handleResetPassword])

  const handleRequestDelete = useCallback(() => {
    setShowActions(false)
    setShowDelete(true)
  }, [])

  return (
    <div className="min-h-screen text-white flex flex-col">

      <ClientDashboardHeader
        onBack={onBack}
        tab={tab}
        onSelectTab={handleSelectTab}
        hasTests={profile.hasTests}
        client={client}
        showActions={showActions}
        onToggleActions={handleToggleActions}
        onExportPdf={handleExportPdf}
        onResetPassword={handleResetPasswordFromMenu}
        onRequestDelete={handleRequestDelete}
      />

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

          {tab === 'atleta' && (
            <AtletaTab
              client={client}
              orgId={orgId}
              campCount={campCount}
              rankObj={rankObj}
              ruoloObj={ruoloObj}
              categoriaObj={categoriaObj}
              profileType={profileType}
              biaRankObj={biaRankObj}
            />
          )}

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
                    <ErrorBoundary fallback={ChartErrorFallback}>
                      <StatsChart campionamenti={client.campionamenti} color="var(--rx-green)" categoria={client.categoria} />
                    </ErrorBoundary>
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
                  <ErrorBoundary fallback={ChartErrorFallback}>
                    <BiaHistoryChart biaHistory={client.biaHistory} color="var(--rx-green)" />
                  </ErrorBoundary>
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
            <MisureSection client={client} color="var(--rx-green)" readonly={readonly} onUpdate={handleUpdateMisure} />
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
        <Suspense fallback={null}>
          <ClientReportPrint client={client} color="var(--rx-green)" rankObj={rankObj} mode={printMode} onClose={() => setShowReport(false)} />
        </Suspense>
      )}
    </div>
  )
}



