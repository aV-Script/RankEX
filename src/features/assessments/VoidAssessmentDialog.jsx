import { useState, useCallback } from 'react'
import { Field, Textarea }    from '../../components/ui'
import { ConfirmDialog }      from '../../components/common/ConfirmDialog'
import { validateVoidReason, TEXT_LIMITS } from '../../utils/lipedema'
import { formatDateTime }     from './assessmentFormat'

/**
 * Annullamento di una valutazione (ADR-011): motivo obbligatorio, resta nello
 * storico barrata. Non si può ripristinare.
 */
export function VoidAssessmentDialog({ assessment, onConfirm, onCancel }) {
  const [reason,   setReason]   = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { error, value } = validateVoidReason(reason)

  const handleConfirm = useCallback(async () => {
    if (error) return
    setIsSaving(true)
    try {
      await onConfirm(assessment.id, value)
      onCancel()
    } catch {
      // Errore già mostrato come toast: il dialog resta aperto con il motivo
      setIsSaving(false)
    }
  }, [error, value, assessment.id, onConfirm, onCancel])

  return (
    <ConfirmDialog
      title={`Annullare la valutazione del ${formatDateTime(assessment.performedAt)}?`}
      description="Resta nello storico, barrata, ed è esclusa da andamento e confronti. Non si può ripristinare."
      confirmLabel="ANNULLA VALUTAZIONE"
      cancelLabel="INDIETRO"
      variant="danger"
      loading={isSaving}
      confirmDisabled={Boolean(error)}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      <div className="mb-5">
        <Field label="Motivo" htmlFor="void-reason">
          <Textarea
            id="void-reason" maxLength={TEXT_LIMITS.voidReason} autoFocus
            value={reason} onChange={e => setReason(e.target.value)}
            aria-describedby="void-reason-count"
          />
        </Field>
        <p id="void-reason-count" className="font-body text-[11px] m-0 mt-1 text-right" style={{ color: 'var(--rx-text-muted)' }}>
          {reason.length}/{TEXT_LIMITS.voidReason}
        </p>
      </div>
    </ConfirmDialog>
  )
}
