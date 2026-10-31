import { Badge } from '../../components/ui'
import { ASSESSMENT_OUTCOME, ASSESSMENT_STATUS } from '../../utils/lipedema'
import { COMPARABILITY_REASON_LABELS } from '../../config/lipedemaTests.config'
import { formatLength } from './assessmentFormat'

/**
 * Stati che non sono "valori ordinari" (ADR-012): interrotta, variante di
 * percorso, non confrontabile con la precedente, annullata. Mai colori di
 * giudizio sul valore.
 * @param {object}   props.assessment
 * @param {string[]} [props.nonComparable] — motivi da buildTestHistory
 */
export function AssessmentBadges({ assessment, nonComparable }) {
  const isVoided  = assessment.status === ASSESSMENT_STATUS.VOIDED
  const isStopped = assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY
  const isVariant = assessment.setup?.isStandardCourse === false

  if (!isVoided && !isStopped && !isVariant && !nonComparable) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {isVoided && <Badge color="var(--rx-text-muted)">ANNULLATA</Badge>}
      {isStopped && <Badge color="var(--rx-warning)">INTERROTTA · {assessment.events?.stopTimeS} s</Badge>}
      {isVariant && <Badge color="var(--rx-accent-2)">VARIANTE {formatLength(assessment.setup.courseLengthM)} m</Badge>}
      {nonComparable && (
        <Badge color="var(--rx-warning)">
          NON CONFRONTABILE · {nonComparable.map(reason => COMPARABILITY_REASON_LABELS[reason] ?? reason).join(', ')}
        </Badge>
      )}
    </div>
  )
}
