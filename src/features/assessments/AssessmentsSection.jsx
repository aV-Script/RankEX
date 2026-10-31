import { useState, useMemo, useCallback } from 'react'
import { Button, EmptyState, SectionLabel } from '../../components/ui'
import { buildTestHistory, isValidAssessment, getPrimaryResult } from '../../utils/lipedema'
import { LIPEDEMA_TESTS, LIPEDEMA_TEST_ORDER } from '../../config/lipedemaTests.config'
import { ICON_TEST }              from '../client/client-dashboard/clientDashboardIcons'
import { AssessmentBadges }       from './AssessmentBadges'
import { AssessmentDetailModal }  from './AssessmentDetailModal'
import { VoidAssessmentDialog }   from './VoidAssessmentDialog'
import { DeltaText }              from './DeltaText'
import { PrivacyNoticeBanner, PRIVACY_BANNER_ID } from './PrivacyNotice'
import { formatNumber, formatDateTime } from './assessmentFormat'

const PLACEHOLDER_COUNT = 3

/**
 * Tab "Valutazioni" della dashboard paziente (modulo lipedema): storico per
 * test, dalla più recente, con delta neutro e stati speciali (ADR-011/012).
 * Le annullate sono visibili di default, barrate, con un toggle per nasconderle.
 */
export function AssessmentsSection({
  assessmentsState, needsPrivacyNotice, readonly, terminology,
  onNewAssessment, onCorrect, onRequestPrivacyNotice,
}) {
  const { assessments, isLoading, loadError, reload, handleVoidAssessment } = assessmentsState
  const [hideVoided,   setHideVoided]   = useState(false)
  const [detailEntry,  setDetailEntry]  = useState(null)
  const [voidTarget,   setVoidTarget]   = useState(null)

  // Delta e confronti sempre sullo storico completo; "Nascondi annullate" filtra
  // solo le righe, e un test con sole annullate sparisce
  const histories = useMemo(
    () => LIPEDEMA_TEST_ORDER
      .map(testId => {
        const entries = buildTestHistory(assessments, testId)
        return { testId, entries: hideVoided ? entries.filter(entry => isValidAssessment(entry.assessment)) : entries }
      })
      .filter(history => history.entries.length > 0),
    [assessments, hideVoided],
  )
  const voidedCount = assessments.filter(assessment => !isValidAssessment(assessment)).length
  const canCreate   = !readonly && !needsPrivacyNotice

  // Un solo dialog alla volta: il dettaglio si chiude quando si apre l'annullamento
  const handleRequestVoid = useCallback((assessment) => {
    setDetailEntry(null)
    setVoidTarget(assessment)
  }, [])

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
              onClick={onNewAssessment}
              disabled={needsPrivacyNotice}
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
            description={`Registra il primo ${LIPEDEMA_TESTS[LIPEDEMA_TEST_ORDER[0]].shortName} di questo ${terminology.client.toLowerCase()}.`}
            action={canCreate ? { label: `+ NUOVA ${terminology.assessment.toUpperCase()}`, onClick: onNewAssessment } : undefined}
          />
        )}

        {!loadError && histories.map(({ testId, entries }) => (
          <TestHistory
            key={testId}
            testId={testId}
            entries={entries}
            onOpen={setDetailEntry}
          />
        ))}
      </div>

      {detailEntry && (
        <AssessmentDetailModal
          entry={detailEntry}
          assessments={assessments}
          readonly={readonly}
          onClose={() => setDetailEntry(null)}
          onCorrect={handleCorrect}
          onVoid={handleRequestVoid}
        />
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

function TestHistory({ testId, entries, onOpen }) {
  const test = LIPEDEMA_TESTS[testId]
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-display text-[12px] font-bold tracking-[1px] text-white m-0">
        {test.shortName} · {test.name}
      </h3>
      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {entries.map(entry => (
          <li key={entry.assessment.id}>
            <HistoryRow entry={entry} unit={test.unit} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function HistoryRow({ entry, unit, onOpen }) {
  const { assessment } = entry
  const isVoided = !isValidAssessment(assessment)
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="w-full text-left rounded-[4px] px-4 py-3 flex flex-col gap-1.5 cursor-pointer bg-transparent transition-colors hover:bg-white/[.03]"
      style={{ border: '1px solid var(--rx-border)', opacity: isVoided ? 0.5 : 1 }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{formatDateTime(assessment.performedAt)}</span>
        <span className={`font-display font-black text-[22px] text-white leading-none ${isVoided ? 'line-through' : ''}`}>
          {formatNumber(getPrimaryResult(assessment))} {unit}
        </span>
      </div>
      {!isVoided && <DeltaText entry={entry} />}
      <AssessmentBadges assessment={assessment} nonComparable={entry.nonComparable} />
      {isVoided && assessment.voidReason && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>Motivo: {assessment.voidReason}</span>
      )}
    </button>
  )
}
