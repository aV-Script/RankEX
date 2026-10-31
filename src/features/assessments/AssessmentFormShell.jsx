import { Button, Field, Textarea, WarningNote } from '../../components/ui'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TEXT_LIMITS }   from '../../utils/lipedema'
import { formatDateTime } from './assessmentFormat'

/**
 * Cornice comune dei form di valutazione a schermo intero: titolo, avviso di
 * correzione, sezioni del test (children), barra con riepilogo live + azioni
 * (fissa in basso su mobile, in coda al form su desktop), conferma di
 * salvataggio con il motivo della correzione e conferma d'uscita.
 * @param {object}    props.formState      — useAssessmentForm(...)
 * @param {ReactNode} props.summary        — riepilogo live (aria-live)
 * @param {ReactNode} props.confirmSummary — riepilogo nel dialog di conferma
 */
export function AssessmentFormShell({ test, client, supersedes, formState, summary, confirmSummary, onBack, children }) {
  const {
    form, hasTriedSave, isUnchangedCorrection, isSaving, showConfirm, setShowConfirm, showDiscard, setShowDiscard,
    correctionReason, setCorrectionReason, reasonCheck, handleRequestSave, handleConfirmSave, handleBack,
  } = formState

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-56 lg:pb-10 flex flex-col gap-4">

        <div>
          <h1 className="font-display font-black text-[18px] text-white m-0">
            {supersedes ? 'Correggi valutazione' : 'Nuova valutazione'} · {test.shortName}
          </h1>
          <p className="font-body text-[13px] m-0 mt-1" style={{ color: 'var(--rx-text-muted)' }}>
            {client.name} · {test.name}
          </p>
        </div>

        {supersedes && (
          <WarningNote title="Correzione">
            La valutazione del {formatDateTime(supersedes.performedAt)} sarà annullata e sostituita da questa.
          </WarningNote>
        )}

        {children}

        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:static lg:z-auto lg:p-5 lg:rounded-[4px]"
          style={{ background: 'var(--rx-nav-bg)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--rx-border)' }}
        >
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {hasTriedSave && isUnchangedCorrection && (
              <WarningNote title="Correzione">
                Nessuna differenza dalla valutazione originale: modifica almeno un dato per correggerla.
              </WarningNote>
            )}
            {summary}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleBack} className="flex-1" disabled={isSaving}>INDIETRO</Button>
              <Button size="sm" onClick={handleRequestSave} className="flex-1" loading={isSaving}>SALVA VALUTAZIONE</Button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title={supersedes ? 'Salvare la correzione?' : 'Salvare la valutazione?'}
          description="Dopo il salvataggio non è modificabile: per correggerla dovrai annullarla e reinserirla."
          confirmLabel="SALVA"
          cancelLabel="INDIETRO"
          loading={isSaving}
          confirmDisabled={Boolean(supersedes) && Boolean(reasonCheck.error)}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
        >
          <div className="rounded-[4px] p-3 mb-4 font-body text-[13px] flex flex-col gap-1" style={{ border: '1px solid var(--rx-border)', color: 'var(--rx-text-muted)' }}>
            <span>{formatDateTime(form.performedAt)} · {test.shortName}</span>
            {confirmSummary}
          </div>
          {supersedes && (
            <div className="mb-4">
              <Field label="Motivo della correzione" htmlFor="assessment-correction-reason" error={correctionReason && reasonCheck.error ? reasonCheck.error : undefined}>
                <Textarea
                  id="assessment-correction-reason" maxLength={TEXT_LIMITS.voidReason}
                  value={correctionReason} onChange={e => setCorrectionReason(e.target.value)}
                  aria-describedby="assessment-correction-count"
                />
              </Field>
              <p id="assessment-correction-count" className="font-body text-[11px] m-0 mt-1 text-right" style={{ color: 'var(--rx-text-muted)' }}>
                {correctionReason.length}/{TEXT_LIMITS.voidReason}
              </p>
            </div>
          )}
        </ConfirmDialog>
      )}

      {showDiscard && (
        <ConfirmDialog
          title="Uscire senza salvare?"
          description="I dati inseriti in questa valutazione andranno persi."
          confirmLabel="ESCI"
          cancelLabel="INDIETRO"
          variant="danger"
          onConfirm={onBack}
          onCancel={() => setShowDiscard(false)}
        />
      )}
    </div>
  )
}
