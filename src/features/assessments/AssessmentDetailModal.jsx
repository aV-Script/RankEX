import { Button, Modal, SectionLabel } from '../../components/ui'
import { ASSESSMENT_OUTCOME, isValidAssessment } from '../../utils/lipedema'
import {
  LIPEDEMA_TESTS, CLINICAL_ROWS, getAssistiveDeviceLabel, getStopReasonLabel,
} from '../../config/lipedemaTests.config'
import { AssessmentBadges } from './AssessmentBadges'
import { DeltaText }        from './DeltaText'
import { formatNumber, formatLength, formatDateTime, formatTimestamp } from './assessmentFormat'

/**
 * Dettaglio di una valutazione: risultato, prova grezza con la formula, setup,
 * parametri clinici e tracciabilità (ADR-011). Azioni solo se scrivibile e
 * valida; staff_readonly vede tutto senza footer.
 */
export function AssessmentDetailModal({ entry, assessments, readonly, onClose, onCorrect, onVoid }) {
  const { assessment } = entry
  const test       = LIPEDEMA_TESTS[assessment.testId]
  const { setup = {}, events = {}, clinical = {}, deviation = {}, result = {} } = assessment
  const trial      = assessment.trials?.[0] ?? {}
  const isStopped  = assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY
  const hasClinical = CLINICAL_ROWS.some(row => clinical[row.pre] != null || clinical[row.post] != null) || Boolean(clinical.conditionsNote)
  const replaced   = assessments.find(item => item.id === assessment.supersedes)
  const replacedBy = assessments.find(item => item.id === assessment.supersededBy)
  const canAct     = !readonly && isValidAssessment(assessment)

  return (
    <Modal title={`${test?.shortName ?? assessment.testId} · ${formatDateTime(assessment.performedAt)}`} onClose={onClose} size="lg">
      <div className="flex flex-col gap-5 font-body text-[13px]" style={{ color: 'var(--rx-text-muted)' }}>

        <DetailSection title="Risultato">
          <div className="flex flex-col gap-1.5">
            <span className={`font-display font-black text-[28px] text-white leading-none ${isValidAssessment(assessment) ? '' : 'line-through opacity-50'}`}>
              {formatNumber(result.distanceM)} m
            </span>
            <span>
              {isStopped ? `Interrotta a ${events.stopTimeS} s` : `Durata ${result.durationS} s`} · velocità media {formatNumber(result.avgSpeedMs, 2)} m/s
            </span>
            <DeltaText entry={entry} />
            <AssessmentBadges assessment={assessment} nonComparable={entry.nonComparable} />
          </div>
        </DetailSection>

        <DetailSection title="Prova grezza">
          <Row label={`Tratti completi${isStopped ? " fino all'interruzione" : ''}`} value={trial.fullLengths} />
          <Row label="Frazione finale" value={`${formatNumber(trial.partialDistanceM, 1)} m`} />
          <Row label="Formula" value={`${trial.fullLengths} × ${formatLength(setup.courseLengthM)} m + ${formatNumber(trial.partialDistanceM, 1)} m = ${formatNumber(result.distanceM)} m (arrotondato al metro)`} />
        </DetailSection>

        <DetailSection title="Setup">
          <Row label="Protocollo" value={`${test?.shortName ?? ''} · ${assessment.protocolVersion}`} />
          <Row label="Lunghezza percorso" value={`${formatLength(setup.courseLengthM)} m${setup.isStandardCourse === false ? ' (variante)' : ''}`} />
          <Row label="Ausilio" value={`${getAssistiveDeviceLabel(setup.assistiveDevice)}${setup.assistiveDeviceNote ? ` — ${setup.assistiveDeviceNote}` : ''}`} />
          {isStopped && (
            <Row
              label="Motivo dell'interruzione"
              value={`${getStopReasonLabel(clinical.stopReasonCode)}${clinical.stopReasonNote ? ` — ${clinical.stopReasonNote}` : ''}`}
            />
          )}
        </DetailSection>

        <DetailSection title="Pause">
          <Row label="Numero" value={events.pauseCount ?? 0} />
          {events.pauseCount > 0 && <Row label="Durata totale" value={`${events.pauseDurationS} s`} />}
        </DetailSection>

        {hasClinical && (
          <DetailSection title="Parametri clinici">
            <table className="w-full text-left">
              <thead>
                <tr className="font-display text-[10px] tracking-[2px]">
                  <th className="font-normal py-1" />
                  <th className="font-normal py-1 text-center">PRE</th>
                  <th className="font-normal py-1 text-center">POST</th>
                </tr>
              </thead>
              <tbody>
                {CLINICAL_ROWS.filter(row => clinical[row.pre] != null || clinical[row.post] != null).map(row => (
                  <tr key={row.pre} style={{ borderTop: '1px solid var(--rx-border)' }}>
                    <td className="py-1.5">{row.label}</td>
                    <td className="py-1.5 text-center text-white/80">{clinical[row.pre] ?? '—'}</td>
                    <td className="py-1.5 text-center text-white/80">{clinical[row.post] ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clinical.conditionsNote && <Row label="Condizioni concomitanti" value={clinical.conditionsNote} />}
          </DetailSection>
        )}

        <DetailSection title="Deviazione dal protocollo">
          <span>{deviation.present ? deviation.note : 'Nessuna'}</span>
        </DetailSection>

        {assessment.notes && (
          <DetailSection title="Note">
            <span className="whitespace-pre-wrap">{assessment.notes}</span>
          </DetailSection>
        )}

        <DetailSection title="Tracciabilità">
          <Row label="Eseguita da" value={`${assessment.examinerName ?? '—'} · registrata il ${formatTimestamp(assessment.createdAt)}`} />
          {assessment.supersedes && (
            <Row label="Sostituisce" value={replaced ? `la valutazione del ${formatDateTime(replaced.performedAt)}` : 'una valutazione annullata'} />
          )}
          {!isValidAssessment(assessment) && (
            <>
              <Row label="Annullata da" value={`${assessment.voidedByName ?? '—'} · il ${formatTimestamp(assessment.voidedAt)}`} />
              <Row label="Motivo" value={assessment.voidReason} />
              {replacedBy && <Row label="Sostituita da" value={`la valutazione del ${formatDateTime(replacedBy.performedAt)}`} />}
            </>
          )}
        </DetailSection>

        {canAct && (
          <div className="flex gap-3 pt-2">
            <Button size="sm" variant="ghost" className="flex-1" onClick={() => onCorrect(assessment)}>CORREGGI</Button>
            <Button size="sm" variant="dangerGhost" className="flex-1" onClick={() => onVoid(assessment)}>ANNULLA VALUTAZIONE</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function DetailSection({ title, children }) {
  return (
    <section className="flex flex-col gap-1.5">
      <SectionLabel className="!mb-1">{title}</SectionLabel>
      {children}
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <span className="sm:w-48 shrink-0 text-white/40">{label}</span>
      <span className="text-white/80 break-words">{value}</span>
    </div>
  )
}
