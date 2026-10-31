import { Button, Modal } from '../../components/ui'
import { ASSESSMENT_OUTCOME, isValidAssessment } from '../../utils/lipedema'
import { LIPEDEMA_TESTS } from '../../config/lipedemaTests.config'
import { ASSESSMENT_UI, formatAssessmentPrimary } from './assessmentRegistry'
import { AssessmentBadges } from './AssessmentBadges'
import { DeltaText }        from './DeltaText'
import { DetailSection, Row } from './AssessmentDetailParts'
import { formatDateTime, formatTimestamp } from './assessmentFormat'

/**
 * Dettaglio di una valutazione: risultato, prove grezze e setup (parte del test,
 * dal registro), parametri clinici e tracciabilità (ADR-011). Azioni solo se
 * scrivibile e valida; staff_readonly vede tutto senza footer.
 */
export function AssessmentDetailModal({ entry, assessments, readonly, onClose, onCorrect, onVoid }) {
  const { assessment } = entry
  const test       = LIPEDEMA_TESTS[assessment.testId]
  const ui         = ASSESSMENT_UI[assessment.testId]
  const { clinical = {}, deviation = {} } = assessment
  const clinicalRows = test?.clinicalRows ?? []
  const filledRows = clinicalRows.filter(row => clinical[row.pre] != null || clinical[row.post] != null)
  const hasClinical = filledRows.length > 0 || Boolean(clinical.conditionsNote)
  const replaced   = assessments.find(item => item.id === assessment.supersedes)
  const replacedBy = assessments.find(item => item.id === assessment.supersededBy)
  // Correggere richiede il form del test: solo per i test nel registro
  const canAct     = !readonly && isValidAssessment(assessment) && Boolean(ui)
  // 0 da invalidazione: non barrato né in evidenza, è un esito non ordinario
  const valueStyle = !isValidAssessment(assessment)
    ? 'line-through opacity-50'
    : assessment.outcome === ASSESSMENT_OUTCOME.INVALIDATED ? 'opacity-60' : ''

  return (
    <Modal title={`${test?.shortName ?? assessment.testId} · ${formatDateTime(assessment.performedAt)}`} onClose={onClose} size="lg">
      <div className="flex flex-col gap-5 font-body text-[13px]" style={{ color: 'var(--rx-text-muted)' }}>

        <DetailSection title="Risultato">
          <div className="flex flex-col gap-1.5">
            <span className={`font-display font-black text-[28px] text-white leading-none ${valueStyle}`}>
              {formatAssessmentPrimary(assessment)}
            </span>
            {ui && <ui.ResultInfo assessment={assessment} />}
            <DeltaText entry={entry} />
            <AssessmentBadges assessment={assessment} nonComparable={entry.nonComparable} />
          </div>
        </DetailSection>

        {ui && test && <ui.Detail assessment={assessment} test={test} />}

        {hasClinical && (
          <DetailSection title="Parametri clinici">
            {filledRows.length > 0 && (
              <table className="w-full text-left">
                <thead>
                  <tr className="font-display text-[10px] tracking-[2px]">
                    <th className="font-normal py-1" />
                    <th className="font-normal py-1 text-center">PRE</th>
                    <th className="font-normal py-1 text-center">POST</th>
                  </tr>
                </thead>
                <tbody>
                  {filledRows.map(row => (
                    <tr key={row.pre} style={{ borderTop: '1px solid var(--rx-border)' }}>
                      <td className="py-1.5">{row.label}</td>
                      <td className="py-1.5 text-center text-white/80">{clinical[row.pre] ?? '—'}</td>
                      <td className="py-1.5 text-center text-white/80">{clinical[row.post] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
