import { useMemo } from 'react'
import { Button, SectionLabel } from '../../components/ui'
import { getLatestValidByTest, ASSESSMENT_OUTCOME } from '../../utils/lipedema'
import { LIPEDEMA_TESTS, LIPEDEMA_TEST_ORDER } from '../../config/lipedemaTests.config'
import { formatAssessmentPrimary } from './assessmentRegistry'
import { AssessmentBadges } from './AssessmentBadges'
import { formatDate } from './assessmentFormat'

/**
 * Card "Ultime valutazioni" nella tab Paziente: una riga per test implementato,
 * anche mai eseguito, con l'ultimo valore valido (per lato nei bilaterali) e
 * il link allo storico completo. Porta gli stessi badge dello storico
 * (interrotta, invalidata, variante, lato incompleto) perché non sembri un
 * valore ordinario (BUG-013); il confronto con la precedente resta nella tab Valutazioni.
 */
export function LatestAssessmentsCard({ assessmentsState, terminology, onViewAll }) {
  const { assessments, isLoading, loadError } = assessmentsState
  const latest = useMemo(() => getLatestValidByTest(assessments), [assessments])

  return (
    <div className="rx-card rounded-[4px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel className="!mb-0">◈ Ultime {terminology.assessments.toLowerCase()}</SectionLabel>
        <Button size="sm" variant="ghost" onClick={onViewAll}>VEDI TUTTE</Button>
      </div>

      {isLoading && assessments.length === 0 && <div className="h-10 rounded-[4px] animate-pulse rx-card" aria-busy="true" />}

      {!isLoading && loadError && (
        <p className="font-body text-[13px] m-0" style={{ color: 'var(--rx-danger)' }}>Impossibile caricare le valutazioni</p>
      )}

      {!isLoading && !loadError && LIPEDEMA_TEST_ORDER.map(testId => {
        const assessment = latest[testId]
        const test       = LIPEDEMA_TESTS[testId]
        const isInvalidated = assessment?.outcome === ASSESSMENT_OUTCOME.INVALIDATED
        return (
          <div key={testId} className="flex flex-col gap-1.5" style={{ borderTop: '1px solid var(--rx-border)', paddingTop: 10 }}>
            <div className="flex items-baseline justify-between gap-x-3 gap-y-1 flex-wrap">
              <span className="font-display text-[11px] font-bold tracking-[1px] text-white">{test.shortName}</span>
              {assessment ? (
                <span className="font-display font-black text-[18px]" style={{ color: isInvalidated ? 'var(--rx-text-muted)' : '#fff' }}>
                  {formatAssessmentPrimary(assessment)}
                </span>
              ) : (
                <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>Non ancora eseguito</span>
              )}
            </div>
            {assessment && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{formatDate(assessment.performedAt)}</span>
                <AssessmentBadges assessment={assessment} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
