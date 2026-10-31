import { formatAssessmentDelta } from './assessmentRegistry'

/**
 * Variazione rispetto alla precedente valutazione valida e confrontabile
 * (utils/lipedema.js → buildTestHistory), per lato nei test bilaterali. Testo
 * neutro: niente verde/rosso né frecce di giudizio (docx 01 §23).
 */
export function DeltaText({ entry }) {
  const text = formatAssessmentDelta(entry)
  if (!text) return null
  return <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{text}</span>
}
