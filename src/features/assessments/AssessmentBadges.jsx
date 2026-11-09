import { Badge } from '../../components/ui'
import { getAssessmentBadges } from './assessmentBadgeRules'

/**
 * Stati che non sono "valori ordinari" (ADR-012, ADR-016): interrotta,
 * invalidata, variante (percorso o sedia), fuori protocollo, errore tecnico,
 * lato incompleto, annullata; con `entry` anche la comparabilità con la
 * precedente (diversa / non confrontabile) e le info sul seriale (ADR-019).
 * Letti dai campi salvati, non dal testId. Mai colori di giudizio sul valore.
 * @param {object} props.assessment
 * @param {object} [props.entry] — riga di buildTestHistory (assente nella card "Ultime valutazioni")
 */
export function AssessmentBadges({ assessment, entry }) {
  const badges = getAssessmentBadges(assessment, entry)
  if (badges.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map(badge => <Badge key={badge.key} color={badge.color}>{badge.label}</Badge>)}
    </div>
  )
}
