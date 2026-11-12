import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { useClientRank }                    from '../../hooks/useClientRank'
import { useReadonly }                       from '../../context/ReadonlyContext'
import { useTrainerState }                   from '../../context/TrainerContext'
import { StatsSection }                      from '../../components/ui'
import { ActivityLog }                       from '../../components/ui'
import { StatsChart }                        from './StatsChart'
import { DeleteDialog }                      from './client-dashboard/DeleteDialog'
import { NotesSection }                      from './client-dashboard/NotesSection'
import { GoalsSection }                      from './client-dashboard/GoalsSection'
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
import { getCategoriaById, CATEGORIE }       from '../../constants'
import { calcBiaScore, getBiaRankFromScore } from '../../utils/bia'
import { calcAge }                           from '../../utils/validation'
import { resetPassword }                     from '../../firebase/services/auth'
import { bySessionGender, PLAYER_ROLES, getModule, capitalize } from '../../config/modules.config'
import { TrophiesSection }                   from './client-dashboard/TrophiesSection'
import { useBadges }                         from '../../hooks/useBadges'
import { getAuth }                           from 'firebase/auth'
import app                                   from '../../firebase/config'
import { PrintPickerModal }                  from '../../components/common/PrintPickerModal'
import { ClientDashboardHeader }             from './client-dashboard/ClientDashboardHeader'
import { getVisibleTabIds }                  from './client-dashboard/dashboardTabs'
import { AtletaTab }                         from './client-dashboard/AtletaTab'
import { ErrorBoundary }                     from '../../components/common/ErrorBoundary'
import { ChartErrorFallback }                from '../../components/common/ChartErrorFallback'
import { useAssessments }                    from '../../hooks/useAssessments'
import { usePrivacyNotice }                  from '../assessments/usePrivacyNotice'
import { AssessmentsSection }                from '../assessments/AssessmentsSection'
import { ASSESSMENT_UI }                     from '../assessments/assessmentRegistry'
import { buildVisitProgress, getNextVisitTestId } from '../assessments/assessmentVisit'
import { PrivacyNoticeBanner, PrivacyNoticeModal, PRIVACY_BANNER_ID } from '../assessments/PrivacyNotice'
import {
  requiresPrivacyNotice, isPrivacyNoticeMissingError, nowLocalDateTime, getLatestValidByTest,
} from '../../utils/lipedema'
import { useUnsavedChanges }                 from '../../context/UnsavedChangesContext'

// Montato solo dietro il flusso di export PDF — lazy-load per non pesare
// sul bundle iniziale della dashboard cliente.
const LipedemaReportPrint = lazy(() =>
  import('../assessments/LipedemaReportPrint').then(m => ({ default: m.LipedemaReportPrint }))
)
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
export function ClientDashboard({ client, orgId, onBack, onCampionamento, onDelete, onClientUpdated }) {
  const { rankObj: testRankObj } = useClientRank(client)
  const { userRole, userName, terminology, moduleType } = useTrainerState()
  const readonly      = useReadonly()
  const capabilities  = useMemo(() => getModule(moduleType), [moduleType])

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
  // Valutazione in corso: { testId, initialForm, supersedes, previous, visitSavedIds } — supersedes =
  // valutazione da correggere, previous = ultima valida dello stesso test (precompilazione, avvisi),
  // visitSavedIds = test già salvati in questa sequenza di visita (STORY-042)
  const [assessmentDraft,  setAssessmentDraft]  = useState(null)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  // Form a schermo intero (campionamento/BIA/valutazione) con dati non salvati:
  // tab, back e nav principale chiedono conferma (UnsavedChangesContext, BUG-011)
  const { setHasUnsavedChanges, guardLeave } = useUnsavedChanges()

  const { handleSaveBia, handleUpgradeProfile } = useBia()
  const { handleUpdateMisure }                  = useMisure()
  const assessmentsState = useAssessments(orgId, client.id, { enabled: capabilities.hasAssessments })
  const { handleRecordPrivacyNotice, handlePrivacyNoticeMissing } = usePrivacyNotice(orgId, onClientUpdated)
  // Valutazioni e BIA si salvano solo con l'informativa registrata (ADR-015 §1)
  const needsPrivacyNotice = requiresPrivacyNotice(capabilities) && !client.privacyNotice

  const currentUser = getAuth(app).currentUser
  const trainerUid  = currentUser?.uid ?? 'trainer'
  const { earnedBadges, allBadges, rawBadges, badgeProgress, handleAwardManual, handleRevoke, handleUpdateShowcase } =
    useBadges(orgId, client.id, client)

  const profileType = client.profileType ?? 'tests_only'
  const profile     = getProfileCategory(profileType)
  // Test percentili solo se il modulo li prevede E il profilo li include
  const hasTests    = capabilities.hasPercentileTests && profile.hasTests
  // Moduli senza profili cliente: la BIA dipende solo dal modulo (lipedema la ha
  // sempre). PT invariato (profilo), soccer invariato (banner upgrade come prima).
  const hasBiaData  = capabilities.hasProfileTypes ? profile.hasBia : (capabilities.hasBia || profile.hasBia)
  const visibleTabIds = getVisibleTabIds(capabilities, hasTests)

  const biaScore   = calcBiaScore(client.lastBia, client.sesso, calcAge(client.dataNascita))
  const biaRank    = getBiaRankFromScore(biaScore)
  const biaRankObj = biaScore > 0 ? biaRank : { label: 'F', color: '#4a5568' }
  const rankObj = profileType === 'bia_only' ? biaRankObj : testRankObj

  // Solo categorie PT reali: getCategoriaById ricade su "Health" per valori ignoti
  // (es. ex-allievi soccer con categoria 'soccer*')
  const categoriaObj = capabilities.hasCategories && CATEGORIE.some(cat => cat.id === client.categoria)
    ? getCategoriaById(client.categoria)
    : null
  const ruoloObj     = capabilities.hasPlayerRoles
    ? PLAYER_ROLES.find(r => r.value === client.ruolo) ?? null
    : null

  const prevStats = client.campionamenti?.[1]?.stats ?? null
  const campCount = client.campionamenti?.length ?? 0

  const trainerAuthor = {
    role: userRole,
    name: currentUser?.email ?? terminology.trainer,
  }
  // Chi esegue la valutazione o registra l'informativa: lo scrive il server
  // (getActorName), qui lo stesso valore dal profilo solo per mostrarlo
  const currentUserName = userName ?? terminology.trainer

  // PDF: moduli con rank come prima; Lipedema per ogni ruolo (staff_readonly incluso), a storico caricato
  const canExportPdf = capabilities.hasRank ||
    (capabilities.hasAssessments && !assessmentsState.isLoading && !assessmentsState.loadError)
  // staff_readonly (BUG-004): dal menu ⋮ niente azioni che scrivono o mandano email
  const canResetPassword = !readonly && capabilities.hasClientLogin && Boolean(client.clientAuthUid && client.email)

  const AssessmentForm = assessmentDraft ? ASSESSMENT_UI[assessmentDraft.testId]?.Form : null

  const defaultTab = 'atleta'
  const tab        = activeTab ?? defaultTab

  const handleDelete = useCallback(async () => {
    try {
      await onDelete(client.id)
      onBack()
    } catch {
      // Errore già mostrato da useClients: si resta sulla scheda del cliente
    } finally {
      setShowDelete(false)
    }
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
    guardLeave(() => {
      setView('dashboard')
      setActiveTab(id)
    })
  }, [guardLeave])

  const handleBack = useCallback(() => guardLeave(onBack), [guardLeave, onBack])

  const handleToggleActions = useCallback(() => {
    setShowActions(v => !v)
  }, [])

  // Lipedema: report a tabelle su fondo bianco, nessun tema da scegliere (STORY-040)
  const handleExportPdf = useCallback(() => {
    setShowActions(false)
    if (capabilities.hasAssessments) setShowReport(true)
    else setShowPrintPicker(true)
  }, [capabilities.hasAssessments])

  const handleResetPasswordFromMenu = useCallback(() => {
    setShowActions(false)
    handleResetPassword()
  }, [handleResetPassword])

  const handleRequestDelete = useCallback(() => {
    setShowActions(false)
    setShowDelete(true)
  }, [])

  const openVisitTest = useCallback((testId, assessments, visitSavedIds) => {
    const latestByTest = getLatestValidByTest(assessments)
    const previous     = latestByTest[testId] ?? null
    setAssessmentDraft({
      testId,
      initialForm: ASSESSMENT_UI[testId].createForm(nowLocalDateTime(), previous, latestByTest),
      supersedes:  null,
      previous,
      visitSavedIds,
    })
    setView('valutazione')
  }, [])

  const handleNewAssessment = useCallback((testId) => {
    openVisitTest(testId, assessmentsState.assessments, [])
  }, [openVisitTest, assessmentsState.assessments])

  const handleCorrectAssessment = useCallback((assessment) => {
    const others   = assessmentsState.assessments.filter(item => item.id !== assessment.id)
    const previous = getLatestValidByTest(others)[assessment.testId] ?? null
    setAssessmentDraft({
      testId:      assessment.testId,
      initialForm: ASSESSMENT_UI[assessment.testId].formFromAssessment(assessment),
      supersedes:  assessment,
      previous,
    })
    setView('valutazione')
  }, [assessmentsState.assessments])

  const handleCloseAssessment = useCallback(() => {
    setAssessmentDraft(null)
    setActiveTab('valutazioni')
    setView('dashboard')
  }, [])

  // Il prossimo form si precompila dallo storico appena riletto: la gamba dominante
  // dell'OLS viene dall'HHD salvato un attimo prima. Se la rilettura è fallita si
  // usa lo storico già in memoria: quel solo precompilato si perde, il test no.
  const handleSaveAndNext = useCallback((refreshedAssessments) => {
    const visitSavedIds = [...assessmentDraft.visitSavedIds, assessmentDraft.testId]
    const nextTestId    = getNextVisitTestId(assessmentDraft.testId, visitSavedIds)
    if (nextTestId) openVisitTest(nextTestId, refreshedAssessments ?? assessmentsState.assessments, visitSavedIds)
    else handleCloseAssessment()
  }, [assessmentDraft, assessmentsState.assessments, openVisitTest, handleCloseAssessment])

  // Cambiare test senza salvare: con dati inseriti chiede conferma (guardLeave)
  const handleSelectVisitTest = useCallback((testId) => {
    guardLeave(() => openVisitTest(testId, assessmentsState.assessments, assessmentDraft.visitSavedIds))
  }, [guardLeave, openVisitTest, assessmentsState.assessments, assessmentDraft])

  const handleSkipVisitTest = useCallback(() => {
    const nextTestId = getNextVisitTestId(assessmentDraft.testId, assessmentDraft.visitSavedIds)
    if (nextTestId) handleSelectVisitTest(nextTestId)
  }, [assessmentDraft, handleSelectVisitTest])

  // Una correzione riguarda una sola valutazione: niente sequenza
  const assessmentVisit = useMemo(() => {
    if (!assessmentDraft || assessmentDraft.supersedes) return undefined
    return {
      ...buildVisitProgress(assessmentDraft.testId, assessmentDraft.visitSavedIds),
      onSaveAndNext: handleSaveAndNext,
      onSkip:        handleSkipVisitTest,
      onSelectTest:  handleSelectVisitTest,
    }
  }, [assessmentDraft, handleSaveAndNext, handleSkipVisitTest, handleSelectVisitTest])

  const handleOpenPrivacyModal = useCallback(() => setShowPrivacyModal(true), [])

  const handlePrivacyMissingForClient = useCallback(() => {
    handlePrivacyNoticeMissing(client)
  }, [handlePrivacyNoticeMissing, client])

  const handleSaveBiaForClient = useCallback(async (biaData) => {
    try {
      await handleSaveBia(client, biaData)
    } catch (err) {
      if (isPrivacyNoticeMissingError(err)) handlePrivacyNoticeMissing(client)
      throw err
    }
  }, [handleSaveBia, handlePrivacyNoticeMissing, client])

  return (
    <div className="min-h-screen text-white flex flex-col">

      <ClientDashboardHeader
        onBack={handleBack}
        tab={tab}
        onSelectTab={handleSelectTab}
        visibleTabIds={visibleTabIds}
        terminology={terminology}
        canExportPdf={canExportPdf}
        canResetPassword={canResetPassword}
        canDelete={!readonly}
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
          onDirtyChange={setHasUnsavedChanges}
        />
      )}
      {view === 'bia' && (
        <BiaView
          client={client}
          color={brandGreen}
          onSave={handleSaveBiaForClient}
          onBack={() => setView('dashboard')}
          onDirtyChange={setHasUnsavedChanges}
        />
      )}
      {view === 'valutazione' && AssessmentForm && (
        <AssessmentForm
          client={client}
          examinerName={currentUserName}
          initialForm={assessmentDraft.initialForm}
          supersedes={assessmentDraft.supersedes}
          previous={assessmentDraft.previous}
          visit={assessmentVisit}
          onSave={assessmentsState.handleAddAssessment}
          onBack={handleCloseAssessment}
          onPrivacyNoticeMissing={handlePrivacyMissingForClient}
          onDirtyChange={setHasUnsavedChanges}
        />
      )}
      <div className={`flex-1 flex flex-col min-w-0 ${view !== 'dashboard' ? 'hidden' : ''}`}>

        {/* Banner upgrade — solo per bia_only (manca i test); il caso tests_only è gestito nel tab BIA.
            Nascosto in readonly: l'upgrade scrive sul profilo del cliente (BUG-006) */}
        {!readonly && capabilities.hasProfileTypes && profileType === 'bia_only' && (
          <div className="px-4 pt-3">
            <UpgradeCategoryBanner client={client} color={brandGreen} onUpgrade={handleUpgradeProfile} />
          </div>
        )}

        {/* Banner primo campionamento */}
        {campCount === 0 && !readonly && hasTests && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-[4px] font-body text-[12px] text-white/50 leading-relaxed"
            style={{ background: 'color-mix(in srgb, var(--rx-accent) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-accent) 14%, transparent)' }}
          >
            <span className="font-display text-[9px] tracking-[2px] uppercase mr-2 align-middle" style={{ color: 'var(--rx-accent)' }}>
              Inizia
            </span>
            Esegui il primo campionamento per calcolare il rank dell'atleta. {capitalize(terminology.theSessions)} {bySessionGender(terminology, 'chiusi', 'chiuse')} aggiungono XP e fanno salire di livello.
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
              capabilities={capabilities}
              terminology={terminology}
              readonly={readonly}
              assessmentsState={assessmentsState}
              onViewAssessments={() => handleSelectTab('valutazioni')}
              onRequestPrivacyNotice={handleOpenPrivacyModal}
            />
          )}

          {tab === 'valutazioni' && capabilities.hasAssessments && (
            <AssessmentsSection
              assessmentsState={assessmentsState}
              needsPrivacyNotice={needsPrivacyNotice}
              readonly={readonly}
              terminology={terminology}
              onNewAssessment={handleNewAssessment}
              onCorrect={handleCorrectAssessment}
              onRequestPrivacyNotice={handleOpenPrivacyModal}
            />
          )}

          {tab === 'test' && hasTests && (
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
            hasBiaData ? (
              <section className="px-4 pt-6 flex flex-col gap-4">
                {needsPrivacyNotice && (
                  <PrivacyNoticeBanner readonly={readonly} terminology={terminology} onRegister={handleOpenPrivacyModal} />
                )}
                <div className="rounded-[4px] p-5 rx-card flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-[10px] tracking-[3px] uppercase" style={{ color: 'var(--rx-accent)' }}>◈ BIA</div>
                    {!readonly && (
                      <button
                        onClick={() => setView('bia')}
                        disabled={needsPrivacyNotice}
                        aria-describedby={needsPrivacyNotice ? PRIVACY_BANNER_ID : undefined}
                        className="font-display text-[10px] tracking-[1px] px-3 py-1.5 rounded-[3px] border cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: 'var(--rx-accent)', borderColor: 'color-mix(in srgb, var(--rx-accent) 33%, transparent)', background: 'color-mix(in srgb, var(--rx-accent) 7%, transparent)' }}
                      >
                        + RILEVAMENTO
                      </button>
                    )}
                  </div>
                  <BiaSummary bia={client.lastBia} prevBia={client.biaHistory?.[1] ?? null} sex={client.sesso} age={calcAge(client.dataNascita)} color={brandGreen} rank={capabilities.hasRank ? biaRank.label : null} />
                  <ErrorBoundary fallback={ChartErrorFallback}>
                    <BiaHistoryChart biaHistory={client.biaHistory} color={brandGreen} />
                  </ErrorBoundary>
                </div>
              </section>
            ) : !readonly && (
              <div className="px-4 pt-6">
                <UpgradeCategoryBanner client={client} color={brandGreen} onUpgrade={handleUpgradeProfile} />
              </div>
            )
          )}

          {tab === 'allenamento' && (
            <WorkoutPlanSection orgId={orgId} clientId={client.id} color={brandGreen} readonly={readonly} hasGamification={capabilities.hasGamification} terminology={terminology} />
          )}

          {tab === 'obiettivi' && capabilities.hasGoals && (
            <GoalsSection client={client} orgId={orgId} color={brandGreen} readonly={readonly} terminology={terminology} />
          )}

          {tab === 'calendario' && (
            <section className="px-4 pt-6">
              <div className="rounded-[4px] p-5 rx-card">
                <div className="font-display text-[10px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--rx-accent)' }}>◈ Calendario {terminology.sessions.toLowerCase()}</div>
                <ClientCalendar clientId={client.id} orgId={orgId} client={client} terminology={terminology} hasGamification={capabilities.hasGamification} />
              </div>
            </section>
          )}

          {tab === 'note' && (
            <NotesSection orgId={orgId} clientId={client.id} color={brandGreen} author={trainerAuthor} readonly={readonly} terminology={terminology} />
          )}

          {tab === 'attivita' && capabilities.hasGamification && (
            <section className="px-4 pt-6 flex flex-col gap-4">
              <ErrorBoundary fallback={ChartErrorFallback}>
                <XPTrendChart log={client.log ?? []} color={brandGreen} />
              </ErrorBoundary>
              <ActivityLog log={client.log} color={brandGreen} limit={10} />
            </section>
          )}

          {tab === 'misure' && (
            <MisureSection
              client={client} color={brandGreen} readonly={readonly} onUpdate={handleUpdateMisure}
              needsPrivacyNotice={needsPrivacyNotice} terminology={terminology} onRequestPrivacyNotice={handleOpenPrivacyModal}
            />
          )}

          {tab === 'wearable' && capabilities.hasWearable && (
            <WearableSection client={client} orgId={orgId} color={brandGreen} />
          )}

          {tab === 'trofei' && capabilities.hasGamification && (
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
      {showPrivacyModal && (
        <PrivacyNoticeModal
          client={client}
          examinerName={currentUserName}
          onSubmit={(input) => handleRecordPrivacyNotice(client, input)}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}
      {showReport && (
        <Suspense fallback={null}>
          {capabilities.hasAssessments ? (
            <LipedemaReportPrint client={client} assessments={assessmentsState.assessments} terminology={terminology} onClose={() => setShowReport(false)} />
          ) : (
            <ClientReportPrint client={client} color={brandGreen} rankObj={rankObj} mode={printMode} onClose={() => setShowReport(false)} />
          )}
        </Suspense>
      )}
    </div>
  )
}



