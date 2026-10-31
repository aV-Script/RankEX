import { ASSESSMENT_OUTCOME } from '../../utils/lipedema'
import { formatSignedMeters, formatShortDate } from './assessmentFormat'

/**
 * Variazione rispetto alla precedente valutazione valida e confrontabile
 * (utils/lipedema.js → buildTestHistory). Testo neutro: niente verde/rosso né
 * frecce di giudizio (docx 01 §23).
 */
export function DeltaText({ entry }) {
  const { assessment, reference, delta, deltaUnavailable } = entry
  if (!reference) return null

  const since = `rispetto al ${formatShortDate(reference.performedAt)}`
  if (deltaUnavailable === ASSESSMENT_OUTCOME.STOPPED_EARLY) {
    const which = assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY ? 'questa valutazione è interrotta' : 'quella precedente è interrotta'
    return <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>— {since}: {which}</span>
  }
  return (
    <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
      {formatSignedMeters(delta)} {since}
    </span>
  )
}
