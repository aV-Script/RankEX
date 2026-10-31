import { useMemo } from 'react'
import { Button, SectionLabel } from '../../components/ui'
import { getLatestValidByTest, getPrimaryResult } from '../../utils/lipedema'
import { LIPEDEMA_TESTS, LIPEDEMA_TEST_ORDER } from '../../config/lipedemaTests.config'
import { AssessmentBadges } from './AssessmentBadges'
import { formatNumber, formatDate } from './assessmentFormat'

/**
 * Card "Ultime valutazioni" nella tab Paziente: ultimo valore valido per test,
 * con il link allo storico completo. Porta gli stessi badge dello storico
 * (interrotta, variante di percorso) perché non sembri un valore ordinario
 * (BUG-013); il confronto con la precedente resta nella tab Valutazioni.
 */
export function LatestAssessmentsCard({ assessmentsState, terminology, onViewAll }) {
  const { assessments, isLoading, loadError } = assessmentsState
  const latest  = useMemo(() => getLatestValidByTest(assessments), [assessments])
  const testIds = LIPEDEMA_TEST_ORDER.filter(testId => latest[testId])

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

      {!isLoading && !loadError && testIds.length === 0 && (
        <p className="font-body text-[13px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
          Nessuna {terminology.assessment.toLowerCase()} registrata.
        </p>
      )}

      {testIds.map(testId => {
        const assessment = latest[testId]
        const test       = LIPEDEMA_TESTS[testId]
        return (
          <div key={testId} className="flex flex-col gap-1.5" style={{ borderTop: '1px solid var(--rx-border)', paddingTop: 10 }}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-[11px] font-bold tracking-[1px] text-white">{test.shortName}</span>
              <span className="font-body text-[12px] flex-1" style={{ color: 'var(--rx-text-muted)' }}>
                {formatDate(assessment.performedAt)}
              </span>
              <span className="font-display font-black text-[18px] text-white">
                {formatNumber(getPrimaryResult(assessment))} {test.unit}
              </span>
            </div>
            <AssessmentBadges assessment={assessment} />
          </div>
        )
      })}
    </div>
  )
}
