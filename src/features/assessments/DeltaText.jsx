import { formatAssessmentDelta } from './assessmentRegistry'
import { formatComparisonNote } from './assessmentFormat'

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

/**
 * Note di comparabilità sotto i badge (ADR-019 §5): perché la precedente è
 * diversa e a quale data è riferito il delta, più le info sul seriale.
 */
export function ComparisonNote({ entry }) {
  const notes = formatComparisonNote(entry)
  if (notes.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      {notes.map(note => (
        <span key={note} className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{note}</span>
      ))}
    </div>
  )
}
