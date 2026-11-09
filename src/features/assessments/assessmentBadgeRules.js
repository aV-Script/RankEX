// Badge di stato di una valutazione (testo + colore), letti dai campi salvati:
// condivisi tra la UI (AssessmentBadges) e il PDF (lipedemaReportModel).
import { ASSESSMENT_OUTCOME, ASSESSMENT_STATUS, BILATERAL_SIDE_STATUS, COMPARISON } from '../../utils/lipedema'
import { COMPARABILITY_REASON_LABELS, COMPARABILITY_INFO_LABELS, SIDE_LABELS } from '../../config/lipedemaTests.config'
import { formatLength } from './assessmentFormat'

const WARNING = 'var(--rx-warning)'

/**
 * @param {object} assessment
 * @param {object} [entry] — riga di buildTestHistory
 * @returns {Array<{ key: string, color: string, label: string }>}
 */
export function getAssessmentBadges(assessment, entry) {
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
  // Tetto OLS: dato da leggere accanto al valore, non un giudizio (docx 05 §13)
  for (const [side, isCeiling] of Object.entries(result.ceilingBySide ?? {})) {
    if (isCeiling === true) add(`ceiling-${side}`, 'var(--rx-accent)', `TETTO ${setup.maxDurationS} s · ${SIDE_LABELS[side]?.short ?? side}`)
  }
  const nonComparable = entry?.nonComparable
  if (nonComparable) {
    const reasons = nonComparable.map(reason => COMPARABILITY_REASON_LABELS[reason] ?? reason).join(', ')
    const lead = entry.comparison === COMPARISON.DIFFERS ? 'DIVERSA DALLA PRECEDENTE' : 'NON CONFRONTABILE'
    add('non-comparable', WARNING, `${lead} · ${reasons}`)
  }
  // Un badge per motivo anche se due lati hanno riferimenti diversi (le note li distinguono)
  for (const reason of new Set((entry?.info ?? []).map(item => item.reason))) {
    add(`info-${reason}`, 'var(--rx-text-muted)', `INFO · ${COMPARABILITY_INFO_LABELS[reason]}`)
  }
  return badges
}
