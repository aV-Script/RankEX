import { useState, useCallback, lazy, Suspense } from 'react'
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
import { getAuth }                           from 'firebase/auth'
import app                                   from '../../firebase/config'
import { PrintPickerModal }                  from '../../components/common/PrintPickerModal'
import { ClientDashboardHeader }             from './client-dashboard/ClientDashboardHeader'
import { AtletaTab }                         from './client-dashboard/AtletaTab'
import { ErrorBoundary }                     from '../../components/common/ErrorBoundary'
import { ChartErrorFallback }                from '../../components/common/ChartErrorFallback'

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
  const { userRole, terminology } = useTrainerState()
  const readonly      = useReadonly()

  // Verde di brand risolto dal tema attivo — mai il letterale 'var(--rx-accent)':
  // diversi componenti figli applicano l'opacità concatenando due cifre hex al
  // prop `color` (es. color + '22'), tecnica che produce CSS non valido se
  // `color` è una CSS custom property invece di un hex risolto.
  const brandGreen = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--rx-accent').trim() || '#0fd65a')
    : '#0fd65a'

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
          color={brandGreen}
          onSave={handleSaveCampionamento}
          onBack={() => setView('dashboard')}
        />
      )}
      {view === 'bia' && (
        <BiaView
          client={client}
          color={brandGreen}
          onSave={(biaData) => handleSaveBia(client, biaData)}
          onBack={() => setView('dashboard')}
        />
      )}
      <div className={`flex-1 flex flex-col min-w-0 ${view !== 'dashboard' ? 'hidden' : ''}`}>

        {/* Banner upgrade — solo per bia_only (manca i test); il caso tests_only è gestito nel tab BIA */}
        {profileType === 'bia_only' && (
          <div className="px-4 pt-3">
            <UpgradeCategoryBanner client={client} color={brandGreen} onUpgrade={handleUpgradeProfile} />
          </div>
        )}

        {/* Banner primo campionamento */}
        {campCount === 0 && !readonly && profile.hasTests && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-[4px] font-body text-[12px] text-white/50 leading-relaxed"
            style={{ background: 'color-mix(in srgb, var(--rx-accent) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-accent) 14%, transparent)' }}
          >
            <span className="font-display text-[9px] tracking-[2px] uppercase mr-2 align-middle" style={{ color: 'var(--rx-accent)' }}>
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
                  <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase" style={{ color: 'var(--rx-accent)' }}>◈ Status</div>
                  {!readonly && (
                    <button
                      onClick={() => setView('campionamento')}
                      className="font-display text-[10px] tracking-[1px] px-3 py-1.5 rounded-[3px] border cursor-pointer transition-all"
                      style={{ color: 'var(--rx-accent)', borderColor: 'color-mix(in srgb, var(--rx-accent) 33%, transparent)', background: 'color-mix(in srgb, var(--rx-accent) 7%, transparent)' }}
                    >
                      + CAMPIONAMENTO
                    </button>
                  )}
                </div>
                <StatsSection stats={client.stats} prevStats={prevStats} color={brandGreen} categoria={client.categoria} pentagonSize={160} rankObj={rankObj} />
                {(client.campionamenti?.length ?? 0) > 0 && (
                  <div className="mt-6">
                    <ErrorBoundary fallback={ChartErrorFallback}>
                      <StatsChart campionamenti={client.campionamenti} color={brandGreen} categoria={client.categoria} />
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
                    <div className="font-display text-[10px] tracking-[3px] uppercase" style={{ color: 'var(--rx-accent)' }}>◈ BIA</div>
                    {!readonly && (
                      <button
                        onClick={() => setView('bia')}
                        className="font-display text-[10px] tracking-[1px] px-3 py-1.5 rounded-[3px] border cursor-pointer transition-all"
                        style={{ color: 'var(--rx-accent)', borderColor: 'color-mix(in srgb, var(--rx-accent) 33%, transparent)', background: 'color-mix(in srgb, var(--rx-accent) 7%, transparent)' }}
                      >
                        + RILEVAMENTO
                      </button>
                    )}
                  </div>
                  <BiaSummary bia={client.lastBia} prevBia={client.biaHistory?.[1] ?? null} sex={client.sesso} age={calcAge(client.dataNascita)} color={brandGreen} rank={biaRank.label} />
                  <ErrorBoundary fallback={ChartErrorFallback}>
                    <BiaHistoryChart biaHistory={client.biaHistory} color={brandGreen} />
                  </ErrorBoundary>
                </div>
              </section>
            ) : (
              <div className="px-4 pt-6">
                <UpgradeCategoryBanner client={client} color={brandGreen} onUpgrade={handleUpgradeProfile} />
              </div>
            )
          )}

          {tab === 'allenamento' && (
            <WorkoutPlanSection orgId={orgId} clientId={client.id} color={brandGreen} readonly={readonly} />
          )}

          {tab === 'calendario' && (
            <section className="px-4 pt-6">
              <div className="rounded-[4px] p-5 rx-card">
                <div className="font-display text-[10px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--rx-accent)' }}>◈ Calendario allenamenti</div>
                <ClientCalendar clientId={client.id} orgId={orgId} />
              </div>
            </section>
          )}

          {tab === 'note' && (
            <NotesSection orgId={orgId} clientId={client.id} color={brandGreen} author={trainerAuthor} readonly={readonly} />
          )}

          {tab === 'attivita' && (
            <section className="px-4 pt-6 flex flex-col gap-4">
              <ErrorBoundary fallback={ChartErrorFallback}>
                <XPTrendChart log={client.log ?? []} color={brandGreen} />
              </ErrorBoundary>
              <ActivityLog log={client.log} color={brandGreen} limit={10} />
            </section>
          )}

          {tab === 'misure' && (
            <MisureSection client={client} color={brandGreen} readonly={readonly} onUpdate={handleUpdateMisure} />
          )}

          {tab === 'wearable' && (
            <WearableSection client={client} orgId={orgId} color={brandGreen} />
          )}

          {tab === 'trofei' && (
            <TrophiesSection
              rawBadges={rawBadges}
              earnedBadges={earnedBadges}
              allBadges={allBadges}
              showcase={client.badgeShowcase ?? []}
              readonly={readonly}
              badgeProgress={badgeProgress}
              color={brandGreen}
              onAward={(badgeId, note) => handleAwardManual(badgeId, trainerUid, note)}
              onRevoke={handleRevoke}
              onUpdateShowcase={handleUpdateShowcase}
            />
          )}

        </div>
        </div>
      </div>


      {showDelete && (
        <DeleteDialog clientName={client.name} clientLabel={terminology.client} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}
      {showPrintPicker && (
        <PrintPickerModal
          onSelect={(mode) => { setPrintMode(mode); setShowPrintPicker(false); setShowReport(true) }}
          onCancel={() => setShowPrintPicker(false)}
        />
      )}
      {showReport && (
        <Suspense fallback={null}>
          <ClientReportPrint client={client} color={brandGreen} rankObj={rankObj} mode={printMode} onClose={() => setShowReport(false)} />
        </Suspense>
      )}
    </div>
  )
}



