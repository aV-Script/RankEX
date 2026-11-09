import { useEffect, useRef } from 'react'
import { Button, Field, Textarea, WarningNote } from '../../components/ui'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { TEXT_LIMITS }   from '../../utils/lipedema'
import { formatDateTime } from './assessmentFormat'

// Secondari della visita: meno padding laterale perché a 360 px INDIETRO, SALTA e
// SALVA E CHIUDI stiano su una riga (BUG-014)
const VISIT_SECONDARY_PADDING = '8px 10px'

/**
 * Cornice comune dei form di valutazione a schermo intero: titolo, avviso di
 * correzione, sezioni del test (children), barra con riepilogo live + azioni
 * (fissa in basso su mobile, in coda al form su desktop), conferma di
 * salvataggio con il motivo della correzione e conferma d'uscita.
 * @param {object}    props.formState      — useAssessmentForm(...)
 * @param {ReactNode} props.summary        — riepilogo live (aria-live)
 * @param {ReactNode} props.confirmSummary — riepilogo nel dialog di conferma
 * @param {object}    [props.visit]        — sequenza di visita (STORY-042): assente in correzione.
 *   buildVisitProgress(...) + onSkip, onSelectTest(testId)
 */
export function AssessmentFormShell({ test, client, supersedes, formState, summary, confirmSummary, visit, onBack, children }) {
  const {
    form, hasTriedSave, isUnchangedCorrection, isSaving, showConfirm, setShowConfirm, showDiscard, setShowDiscard,
    correctionReason, setCorrectionReason, reasonCheck, handleRequestSave, handleConfirmSave, handleBack,
  } = formState
  const headingRef = useRef(null)
  // Senza un test successivo il salvataggio chiude la visita: si ricorda cosa resta fuori,
  // senza bloccare. La correzione non ha visit, quindi niente avviso
  const closesVisitWithUnsaved = Boolean(visit && !visit.nextLabel && visit.unsavedLabels?.length)

  // Il form di ogni test si monta nuovo: si riparte dall'alto, altrimenti si aprirebbe
  // a metà pagina, con il focus perso
  useEffect(() => {
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="min-h-screen text-white">
      <div className={`max-w-2xl mx-auto px-4 py-6 ${visit ? 'pb-72' : 'pb-56'} lg:pb-10 flex flex-col gap-4`}>

        <div>
          {visit && (
            <p className="font-display text-[11px] font-bold tracking-[2px] m-0 mb-1" style={{ color: 'var(--rx-accent-2)' }}>
              {visit.position} DI {visit.total}
            </p>
          )}
          <h1 ref={headingRef} tabIndex={-1} className="font-display font-black text-[18px] text-white m-0 outline-none">
            {supersedes ? 'Correggi valutazione' : 'Nuova valutazione'} · {test.shortName}
          </h1>
          <p className="font-body text-[13px] m-0 mt-1" style={{ color: 'var(--rx-text-muted)' }}>
            {client.name} · {test.name}
          </p>
        </div>

        {visit && <VisitSteps steps={visit.steps} disabled={isSaving} onSelectTest={visit.onSelectTest} />}

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
            {visit
              ? <VisitActions visit={visit} isSaving={isSaving} onBack={handleBack} onRequestSave={handleRequestSave} />
              : (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleBack} className="flex-1" disabled={isSaving}>INDIETRO</Button>
                  <Button size="sm" onClick={() => handleRequestSave()} className="flex-1" loading={isSaving}>SALVA VALUTAZIONE</Button>
                </div>
              )}
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
          {closesVisitWithUnsaved && (
            <WarningNote title="Visita" className="mb-4">
              Non salvati in questa visita: {visit.unsavedLabels.join(', ')}
            </WarningNote>
          )}
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

// ── Componenti locali ─────────────────────────────────────────────────────────

/**
 * I 5 test della visita. Un test già salvato non si riapre da qui: un secondo
 * salvataggio creerebbe un doppione, per cambiarlo c'è Correggi nello storico.
 */
function VisitSteps({ steps, disabled, onSelectTest }) {
  const currentRef = useRef(null)

  // Su mobile la barra scorre senza scrollbar: il test corrente deve restare in vista
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [])

  return (
    <nav aria-label="Test della visita" className="flex gap-1.5 overflow-x-auto no-scrollbar">
      {steps.map(({ testId, label, isCurrent, isSaved }) => {
        // aria-disabled, non disabled: da tastiera si legge dove si è e cosa è già salvato
        const isLocked = isSaved || isCurrent
        return (
          <button
            key={testId}
            ref={isCurrent ? currentRef : undefined}
            type="button"
            disabled={disabled}
            aria-disabled={isLocked || undefined}
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={isSaved ? `${label}, salvato` : undefined}
            onClick={isLocked ? undefined : () => onSelectTest(testId)}
            className={`shrink-0 min-h-[44px] px-3 rounded-[4px] font-display text-[11px] font-extrabold tracking-[1.3px] text-white bg-transparent ${isLocked ? 'cursor-default' : 'cursor-pointer hover:bg-white/[.03]'}`}
            style={{
              border: `1px solid ${isCurrent ? 'var(--rx-accent)' : 'var(--rx-border)'}`,
              ...(isCurrent ? { background: 'color-mix(in srgb, var(--rx-accent) 12%, transparent)' } : {}),
              ...(isSaved ? { color: 'var(--rx-accent-2)' } : {}),
            }}
          >
            {isSaved && <span aria-hidden="true">✓ </span>}{label}
          </button>
        )
      })}
    </nav>
  )
}

/** Con un test successivo: passa al prossimo (primario), salva e chiudi, salta. Sull'ultimo: chiude la visita */
function VisitActions({ visit, isSaving, onBack, onRequestSave }) {
  const { nextLabel, onSkip } = visit
  if (!nextLabel) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={onBack} className="flex-auto whitespace-nowrap" disabled={isSaving}>INDIETRO</Button>
        <Button size="sm" onClick={() => onRequestSave()} className="flex-auto whitespace-nowrap" loading={isSaving}>SALVA E CHIUDI LA VISITA</Button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" onClick={() => onRequestSave({ goNext: true })} className="w-full" loading={isSaving}>
        SALVA E PASSA A {nextLabel}
      </Button>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={onBack} padding={VISIT_SECONDARY_PADDING} className="flex-auto whitespace-nowrap" disabled={isSaving}>INDIETRO</Button>
        <Button size="sm" variant="ghost" onClick={onSkip} padding={VISIT_SECONDARY_PADDING} className="flex-auto whitespace-nowrap" disabled={isSaving}>SALTA</Button>
        <Button size="sm" variant="ghost" onClick={() => onRequestSave()} padding={VISIT_SECONDARY_PADDING} className="flex-auto whitespace-nowrap" disabled={isSaving}>SALVA E CHIUDI</Button>
      </div>
    </div>
  )
}
