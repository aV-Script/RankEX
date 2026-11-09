import { formatAssessmentDelta } from './assessmentRegistry'
import { formatComparisonNote } from './assessmentFormat'

/**
 * Variazione rispetto alla precedente valutazione valida e confrontabile
 * (utils/lipedema.js → buildTestHistory), per lato nei test bilaterali. Testo
 * neutro: niente verde/rosso né frecce di giudizio (docx 01 §23). `sameDayDates`:
 * giorni con più valutazioni del test, la cui data breve mostra anche l'ora.
 */
export function DeltaText({ entry, sameDayDates }) {
  const text = formatAssessmentDelta(entry, sameDayDates)
  if (!text) return null
  return <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{text}</span>
}

/**
 * Note di comparabilità sotto i badge (ADR-019 §5): perché la precedente è
 * diversa e a quale data è riferito il delta, più le info sul seriale.
 */
export function ComparisonNote({ entry, sameDayDates }) {
  const notes = formatComparisonNote(entry, sameDayDates)
  if (notes.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      {notes.map(note => (
        <span key={note} className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{note}</span>
      ))}
    </div>
  )
}
