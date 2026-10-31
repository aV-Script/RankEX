import { Badge } from '../../components/ui'
import { ASSESSMENT_OUTCOME, ASSESSMENT_STATUS, BILATERAL_SIDE_STATUS } from '../../utils/lipedema'
import { COMPARABILITY_REASON_LABELS, SIDE_LABELS } from '../../config/lipedemaTests.config'
import { formatLength } from './assessmentFormat'

const WARNING = 'var(--rx-warning)'

/**
 * Stati che non sono "valori ordinari" (ADR-012, ADR-016): interrotta,
 * invalidata, variante (percorso o sedia), fuori protocollo, errore tecnico,
 * lato incompleto, non confrontabile con la precedente, annullata. Letti dai
 * campi salvati, non dal testId. Mai colori di giudizio sul valore.
 * @param {object}   props.assessment
 * @param {string[]} [props.nonComparable] — motivi da buildTestHistory
 */
export function AssessmentBadges({ assessment, nonComparable }) {
  const badges = getBadges(assessment, nonComparable)
  if (badges.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map(badge => <Badge key={badge.key} color={badge.color}>{badge.label}</Badge>)}
    </div>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

function getBadges(assessment, nonComparable) {
  const { setup = {}, events = {}, result = {} } = assessment
  const badges = []
  const add = (key, color, label) => badges.push({ key, color, label })

  if (assessment.status === ASSESSMENT_STATUS.VOIDED) add('voided', 'var(--rx-text-muted)', 'ANNULLATA')
  if (assessment.outcome === ASSESSMENT_OUTCOME.INVALIDATED) add('invalidated', WARNING, 'INVALIDATO · USO BRACCIA')
  if (assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY) {
    add('stopped', WARNING, events.stopTimeS != null ? `INTERROTTA · ${events.stopTimeS} s` : 'INTERROTTA')
  }
  if (setup.isStandardCourse === false) add('variant-course', 'var(--rx-accent-2)', `VARIANTE ${formatLength(setup.courseLengthM)} m`)
  if (setup.isStandardChair === false) add('variant-chair', 'var(--rx-accent-2)', `VARIANTE · SEDIA ${formatLength(setup.chairHeightCm)} cm`)
  if (setup.chairHasArmrests === true) add('armrests', WARNING, 'CON BRACCIOLI')
  if (setup.armsCrossed === false) add('arms', WARNING, 'BRACCIA NON INCROCIATE')
  if (events.technicalError === true) add('technical', WARNING, 'ERRORE TECNICO')
  for (const [side, status] of Object.entries(result.sideStatus ?? {})) {
    if (status === BILATERAL_SIDE_STATUS.COMPLETE) continue
    const which = SIDE_LABELS[side]?.short ?? side
    add(`side-${side}`, WARNING, status === BILATERAL_SIDE_STATUS.NOT_TESTED ? `LATO ${which} NON ESEGUITO` : `LATO ${which} INCOMPLETO`)
  }
  if (nonComparable) {
    add('non-comparable', WARNING, `NON CONFRONTABILE · ${nonComparable.map(reason => COMPARABILITY_REASON_LABELS[reason] ?? reason).join(', ')}`)
  }
  return badges
}
