import { useState, useMemo, useCallback, useId, useRef } from 'react'
import { Button, EmptyState, Modal, SectionLabel } from '../../components/ui'
import { buildTestHistory, buildTrendSeries, byMostRecent, isValidAssessment, getLatestValidByTest, ASSESSMENT_OUTCOME } from '../../utils/lipedema'
import { LIPEDEMA_TESTS, LIPEDEMA_TEST_ORDER } from '../../config/lipedemaTests.config'
import { formatAssessmentPrimary, formatAssessmentSetup } from './assessmentRegistry'
import { ICON_TEST }              from '../client/client-dashboard/clientDashboardIcons'
import { AssessmentBadges }       from './AssessmentBadges'
import { AssessmentDetailModal }  from './AssessmentDetailModal'
import { VoidAssessmentDialog }   from './VoidAssessmentDialog'
import { DeltaText, ComparisonNote } from './DeltaText'
import { AssessmentTrendChart }  from './AssessmentTrendChart'
import { PrivacyNoticeBanner, PRIVACY_BANNER_ID } from './PrivacyNotice'
import { formatDateTime, formatShortDate, getSameDayDatesForTest } from './assessmentFormat'

const PLACEHOLDER_COUNT = 3

const TAB_KEYS = { next: 'ArrowRight', previous: 'ArrowLeft', first: 'Home', last: 'End' }

/**
 * Tab "Valutazioni" della dashboard paziente (modulo lipedema): un test alla
 * volta (selettore a schede), con grafico di andamento e storico dalla più
 * recente, delta neutro e stati speciali (ADR-011/012/019).
 * Le annullate sono visibili di default, barrate, con un toggle per nasconderle.
 * "+ NUOVA VALUTAZIONE" chiede quale test (solo se ce n'è più d'uno):
 * `onNewAssessment(testId)`.
 */
export function AssessmentsSection({
  assessmentsState, needsPrivacyNotice, readonly, terminology,
  onNewAssessment, onCorrect, onRequestPrivacyNotice,
}) {
  const { assessments, isLoading, loadError, reload, handleVoidAssessment } = assessmentsState
  const [hideVoided,   setHideVoided]   = useState(false)
  const [detailEntry,  setDetailEntry]  = useState(null)
  const [voidTarget,   setVoidTarget]   = useState(null)
  const [showPicker,   setShowPicker]   = useState(false)
  const [selectedTestId, setSelectedTestId] = useState(null)
  const tabsId = useId()

  // Test mostrato: la scelta dell'utente, altrimenti (derivato, non salvato) quello
  // della valutazione valida più recente e, senza storico, il primo
  const defaultTestId = useMemo(() => {
    const [latest] = assessments.filter(isValidAssessment).sort(byMostRecent)
    return latest?.testId ?? LIPEDEMA_TEST_ORDER[0]
  }, [assessments])
  const activeTestId = selectedTestId ?? defaultTestId

  // Delta e confronti sempre sullo storico completo; "Nascondi annullate" filtra solo le righe
  const entries = useMemo(() => {
    const all = buildTestHistory(assessments, activeTestId)
    return hideVoided ? all.filter(entry => isValidAssessment(entry.assessment)) : all
  }, [assessments, activeTestId, hideVoided])
  const series = useMemo(() => buildTrendSeries(assessments, activeTestId), [assessments, activeTestId])
  const sameDayDates = useMemo(() => getSameDayDatesForTest(assessments, activeTestId), [assessments, activeTestId])
  // Rilettura dopo un salvataggio: la lista resta, solo lettura locale finché non arriva
  const isRefreshing = isLoading && assessments.length > 0
  const voidedCount = assessments.filter(assessment => !isValidAssessment(assessment)).length
  const canCreate   = !readonly && !needsPrivacyNotice

  // Un solo dialog alla volta: il dettaglio si chiude quando si apre l'annullamento
  const handleRequestVoid = useCallback((assessment) => {
    setDetailEntry(null)
    setVoidTarget(assessment)
  }, [])

  const handleRequestNew = useCallback(() => {
    if (LIPEDEMA_TEST_ORDER.length === 1) onNewAssessment(LIPEDEMA_TEST_ORDER[0])
    else setShowPicker(true)
  }, [onNewAssessment])

  const handlePickTest = useCallback((testId) => {
    setShowPicker(false)
    onNewAssessment(testId)
  }, [onNewAssessment])

  const handleCorrect = useCallback((assessment) => {
    setDetailEntry(null)
    onCorrect(assessment)
  }, [onCorrect])

  return (
    <section className="px-4 pt-6 flex flex-col gap-4">
      {needsPrivacyNotice && (
        <PrivacyNoticeBanner readonly={readonly} terminology={terminology} onRegister={onRequestPrivacyNotice} />
      )}

      <div className="rx-card rounded-[4px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SectionLabel className="!mb-0">◈ {terminology.assessments}</SectionLabel>
          {!readonly && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleRequestNew}
              // Senza storico il form non saprebbe cosa precompilare né cosa confrontare
              disabled={needsPrivacyNotice || isLoading || Boolean(loadError)}
              aria-describedby={needsPrivacyNotice ? PRIVACY_BANNER_ID : undefined}
            >
              + NUOVA VALUTAZIONE
            </Button>
          )}
        </div>

        {voidedCount > 0 && (
          <label className="flex items-center gap-2 font-body text-[12px] cursor-pointer" style={{ color: 'var(--rx-text-muted)' }}>
            <input
              type="checkbox" checked={hideVoided} onChange={e => setHideVoided(e.target.checked)}
              style={{ accentColor: 'var(--rx-accent)' }}
            />
            Nascondi annullate ({voidedCount})
          </label>
        )}

        {isLoading && assessments.length === 0 && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label={`Caricamento ${terminology.assessments.toLowerCase()}`}>
            {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
              <div key={i} className="rx-card rounded-[4px] h-16 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-[4px] p-4 flex flex-col items-start gap-3" style={{ border: '1px solid color-mix(in srgb, var(--rx-danger) 30%, transparent)' }}>
            <span className="font-body text-[13px]" style={{ color: 'var(--rx-danger)' }}>Impossibile caricare le valutazioni</span>
            <Button size="sm" variant="ghost" onClick={reload}>RIPROVA</Button>
          </div>
        )}

        {!isLoading && !loadError && assessments.length === 0 && (
          <EmptyState
            icon={ICON_TEST}
            title={`Nessuna ${terminology.assessment.toLowerCase()}`}
            description={`Registra la prima ${terminology.assessment.toLowerCase()} di questo ${terminology.client.toLowerCase()}.`}
            action={canCreate ? { label: `+ NUOVA ${terminology.assessment.toUpperCase()}`, onClick: handleRequestNew } : undefined}
          />
        )}

        {!loadError && assessments.length > 0 && (
          <>
            <TestSelector tabsId={tabsId} activeTestId={activeTestId} onSelect={setSelectedTestId} />
            <TestHistory
              tabsId={tabsId}
              testId={activeTestId}
              entries={entries}
              series={series}
              sameDayDates={sameDayDates}
              isRefreshing={isRefreshing}
              onOpen={setDetailEntry}
            />
          </>
        )}
      </div>

      {detailEntry && (
        <AssessmentDetailModal
          entry={detailEntry}
          assessments={assessments}
          readonly={readonly}
          isBusy={isRefreshing}
          onClose={() => setDetailEntry(null)}
          onCorrect={handleCorrect}
          onVoid={handleRequestVoid}
        />
      )}
      {showPicker && (
        <TestPicker assessments={assessments} onPick={handlePickTest} onClose={() => setShowPicker(false)} />
      )}
      {voidTarget && (
        <VoidAssessmentDialog
          assessment={voidTarget}
          onConfirm={handleVoidAssessment}
          onCancel={() => setVoidTarget(null)}
        />
      )}
    </section>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

/** Schede dei test (role="tablist"): a capo, non in uno scroller (360 px); frecce, Home e Fine */
function TestSelector({ tabsId, activeTestId, onSelect }) {
  const tabRefs = useRef({})

  const handleKeyDown = useCallback((e, index) => {
    const last = LIPEDEMA_TEST_ORDER.length - 1
    const targets = {
      [TAB_KEYS.next]:     index === last ? 0 : index + 1,
      [TAB_KEYS.previous]: index === 0 ? last : index - 1,
      [TAB_KEYS.first]:    0,
      [TAB_KEYS.last]:     last,
    }
    const target = targets[e.key]
    if (target === undefined) return
    e.preventDefault()
    const testId = LIPEDEMA_TEST_ORDER[target]
    onSelect(testId)
    tabRefs.current[testId]?.focus()
  }, [onSelect])

  return (
    <div role="tablist" aria-label="Test" className="flex flex-wrap gap-1.5">
      {LIPEDEMA_TEST_ORDER.map((testId, index) => {
        const isActive = testId === activeTestId
        return (
          <button
            key={testId}
            ref={node => { tabRefs.current[testId] = node }}
            id={getTabId(tabsId, testId)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={getPanelId(tabsId)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(testId)}
            onKeyDown={e => handleKeyDown(e, index)}
            className="px-3 py-1.5 rounded-[3px] font-display text-[11px] border cursor-pointer transition-all"
            style={isActive
              ? { background: 'color-mix(in srgb, var(--rx-accent) 20%, transparent)', borderColor: 'color-mix(in srgb, var(--rx-accent) 40%, transparent)', color: 'var(--rx-accent)' }
              : { background: 'transparent', borderColor: 'var(--rx-border)', color: 'var(--rx-text-muted)' }}
          >
            {LIPEDEMA_TESTS[testId].shortName}
          </button>
        )
      })}
    </div>
  )
}

function TestHistory({ tabsId, testId, entries, series, sameDayDates, isRefreshing, onOpen }) {
  const test    = LIPEDEMA_TESTS[testId]
  const titleId = useId()
  return (
    <div
      role="tabpanel"
      id={getPanelId(tabsId)}
      aria-labelledby={getTabId(tabsId, testId)}
      aria-busy={isRefreshing}
      className="flex flex-col gap-3"
    >
      <div className="flex items-baseline justify-between gap-x-3 gap-y-1 flex-wrap">
        <h3 id={titleId} className="font-display text-[12px] font-bold tracking-[1px] text-white m-0">
          {test.shortName} · {test.name}
        </h3>
        {isRefreshing && <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>Aggiornamento in corso…</span>}
      </div>

      <AssessmentTrendChart series={series} test={test} describedById={titleId} />

      {entries.length === 0 ? (
        <p className="font-body text-[13px] m-0" style={{ color: 'var(--rx-text-muted)' }}>Nessuna valutazione di questo test</p>
      ) : (
        <ul className="flex flex-col gap-2 list-none m-0 p-0">
          {entries.map(entry => (
            <li key={entry.assessment.id}>
              <HistoryRow entry={entry} sameDayDates={sameDayDates} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function HistoryRow({ entry, sameDayDates, onOpen }) {
  const { assessment } = entry
  const isVoided = !isValidAssessment(assessment)
  // 0 da invalidazione in tono smorzato, non barrato: non è un valore ordinario
  const isInvalidated = assessment.outcome === ASSESSMENT_OUTCOME.INVALIDATED
  const setupLine = [formatAssessmentSetup(assessment), assessment.examinerName].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="w-full text-left rounded-[4px] px-4 py-3 flex flex-col gap-1.5 cursor-pointer bg-transparent transition-colors hover:bg-white/[.03]"
      style={{ border: '1px solid var(--rx-border)', opacity: isVoided ? 0.5 : 1 }}
    >
      <div className="flex items-baseline justify-between gap-x-3 gap-y-1 flex-wrap">
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{formatDateTime(assessment.performedAt)}</span>
        <span
          className={`font-display font-black text-[20px] leading-none text-right ${isVoided ? 'line-through' : ''}`}
          style={{ color: isInvalidated ? 'var(--rx-text-muted)' : '#fff' }}
        >
          {formatAssessmentPrimary(assessment)}
        </span>
      </div>
      {!isVoided && <DeltaText entry={entry} sameDayDates={sameDayDates} />}
      {setupLine && <span className="font-body text-[12px] break-words" style={{ color: 'var(--rx-text-muted)' }}>{setupLine}</span>}
      <AssessmentBadges assessment={assessment} entry={entry} />
      {!isVoided && <ComparisonNote entry={entry} sameDayDates={sameDayDates} />}
      {isVoided && assessment.voidReason && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>Motivo: {assessment.voidReason}</span>
      )}
    </button>
  )
}

/** "Quale test?": un bottone per test implementato, con l'ultima esecuzione valida */
function TestPicker({ assessments, onPick, onClose }) {
  const latest = getLatestValidByTest(assessments)
  return (
    <Modal title="Quale test?" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {LIPEDEMA_TEST_ORDER.map(testId => {
          const test = LIPEDEMA_TESTS[testId]
          return (
            <button
              key={testId}
              type="button"
              onClick={() => onPick(testId)}
              className="w-full min-h-[56px] text-left rounded-[4px] px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer bg-transparent transition-colors hover:bg-white/[.03]"
              style={{ border: '1px solid var(--rx-border)' }}
            >
              <span className="flex flex-col min-w-0">
                <span className="font-display font-bold text-[13px] text-white">{test.shortName}</span>
                <span className="font-body text-[12px] truncate" style={{ color: 'var(--rx-text-muted)' }}>{test.name}</span>
              </span>
              <span className="font-body text-[12px] shrink-0" style={{ color: 'var(--rx-text-muted)' }}>
                {latest[testId] ? `Ultima: ${formatShortDate(latest[testId].performedAt)}` : 'Mai eseguito'}
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

function getTabId(tabsId, testId) {
  return `${tabsId}-tab-${testId}`
}

function getPanelId(tabsId) {
  return `${tabsId}-panel`
}
