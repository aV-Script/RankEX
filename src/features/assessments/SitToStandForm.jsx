import { useState, useMemo, useCallback } from 'react'
import { Field, Input, Textarea, SectionLabel, WarningNote } from '../../components/ui'
import { computeSitToStandResult, SIT_TO_STAND_30S, LIPEDEMA_TEST_IDS, TEXT_LIMITS } from '../../utils/lipedema'
import {
  buildSitToStandInput, countSitToStandClinicalFilled, getSitToStandFieldOrder, isStandardChairHeight, isDeviationRequired,
  isSameChairHeight,
} from './sitToStandFormModel'
import { fieldId } from './formModelUtils'
import { useAssessmentForm }   from './useAssessmentForm'
import { AssessmentFormShell } from './AssessmentFormShell'
import {
  YesNoField, ReadonlyValue, VariantConfirm, StopReasonFields, PauseFields, ClinicalSection, ClosingSection, StepperInput,
} from './AssessmentFormFields'
import { formatNumber, formatLength, formatShortDate } from './assessmentFormat'
import { LIPEDEMA_TESTS } from '../../config/lipedemaTests.config'

const TEST = LIPEDEMA_TESTS[LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S]
const { durationS: DURATION_S, maxRepetitions: MAX_REPETITIONS, standardChairHeightCm: STANDARD_CHAIR_CM } = SIT_TO_STAND_30S
const MAX_STOP_TIME_S = DURATION_S - 1
const STOP_FIELDS = ['clinical.stopReasonCode', 'clinical.stopReasonNote']
const DEVIATION_LOCK_HELP = 'Sedia con braccioli o braccia non incrociate: la deviazione è obbligatoria, descrivila.'

/**
 * Nuova valutazione 30s-STS a schermo intero (ADR-016 §6). Una prova ufficiale:
 * alzate complete + parziale finale (il totale lo calcola il server, qui
 * l'anteprima con la stessa funzione). Uso delle braccia → 0 INVALIDATO, distinto
 * dall'interruzione; errore tecnico distinto da deviazione e note.
 * @param {object|null} props.previous — ultima 30s-STS valida (avviso sedia diversa)
 */
export function SitToStandForm({ client, examinerName, initialForm, supersedes, previous, onSave, onBack, onPrivacyNoticeMissing, onDirtyChange }) {
  const [isClinicalOpen, setIsClinicalOpen] = useState(() => countSitToStandClinicalFilled(initialForm) > 0)

  const handleRevealField = useCallback((field) => {
    if (field.startsWith('clinical.') && !STOP_FIELDS.includes(field)) setIsClinicalOpen(true)
  }, [])

  const formState = useAssessmentForm({
    initialForm, buildInput: buildSitToStandInput, getFieldOrder: getSitToStandFieldOrder,
    onRevealField: handleRevealField, birthDate: client.dataNascita ?? null, supersedes,
    onSave, onBack, onPrivacyNoticeMissing, onDirtyChange,
  })
  const { form, setForm, setField, setValue, setClinical, input, errors, visibleErrors, nowLocal } = formState

  const preview = useMemo(() => {
    const { completeRepetitions, partialRepCounted } = input.trial
    const hasRepetitions = Number.isInteger(completeRepetitions) && completeRepetitions >= 0
    if (errors['events.stopTimeS'] || (!input.events.usedArms && !hasRepetitions)) return null
    return computeSitToStandResult({
      completeRepetitions, partialRepCounted,
      usedArms:  input.events.usedArms,
      stopTimeS: input.events.stopTimeS,
    })
  }, [errors, input])

  const chairHeight     = input.setup.chairHeightCm
  const isChairValid    = !errors['setup.chairHeightCm'] && chairHeight !== null
  const isVariant       = isChairValid && !isStandardChairHeight(chairHeight)
  const previousHeight  = previous?.setup?.chairHeightCm ?? null
  // Solo oltre la tolleranza di comparabilità, e non in correzione (si confronta con sé stessa)
  const isHeightChanged = !supersedes && isChairValid && previousHeight !== null && !isSameChairHeight(previousHeight, chairHeight)
  const isDeviationLocked = isDeviationRequired(form)
  const isStopped       = !form.usedArms && form.stoppedEarly

  // Braccioli o braccia libere attivano la deviazione (il server la richiede)
  const handleSetupFlag = useCallback((key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      return isDeviationRequired(next) ? { ...next, deviationPresent: true } : next
    })
  }, [setForm])

  // Uso braccia ≠ interruzione: non coesistono; le alzate diventano facoltative
  const handleUsedArms = useCallback((value) => {
    setForm(prev => ({
      ...prev,
      usedArms:            value,
      stoppedEarly:        value ? false : prev.stoppedEarly,
      partialRepCounted:   value ? false : prev.partialRepCounted,
      completeRepetitions: value && prev.completeRepetitions === '0' ? '' : prev.completeRepetitions,
    }))
  }, [setForm])

  const handleStopped = useCallback((value) => {
    setForm(prev => ({ ...prev, stoppedEarly: value, partialRepCounted: value ? false : prev.partialRepCounted }))
  }, [setForm])

  const handleStepRepetitions = useCallback((delta) => {
    setForm(prev => {
      const current = Number.parseInt(prev.completeRepetitions, 10)
      const next    = Math.min(MAX_REPETITIONS, Math.max(0, (Number.isNaN(current) ? 0 : current) + delta))
      return { ...prev, completeRepetitions: String(next) }
    })
  }, [setForm])

  const stoppedSuffix = isStopped ? " fino all'interruzione" : ''

  return (
    <AssessmentFormShell
      test={TEST}
      client={client}
      supersedes={supersedes}
      formState={formState}
      onBack={onBack}
      summary={<ResultSummary preview={preview} input={input} />}
      confirmSummary={(
        <>
          <span className="font-display font-black text-[20px] text-white">
            {preview ? `${formatNumber(preview.repetitions)} ripetizioni` : '—'}
          </span>
          <span>
            {describeOutcome(input)}
            {isVariant ? ` · variante ${formatLength(chairHeight)} cm` : ''}
            {form.chairHasArmrests ? ' · con braccioli' : ''}
          </span>
        </>
      )}
    >
      {/* A. Setup */}
      <section className="rx-card rounded-[4px] p-5 flex flex-col gap-4">
        <SectionLabel>◈ Setup</SectionLabel>

        <Field label="Data e ora" htmlFor={fieldId('performedAt')} error={visibleErrors.performedAt}>
          <Input id={fieldId('performedAt')} type="datetime-local" max={nowLocal} value={form.performedAt} onChange={setField('performedAt')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadonlyValue label="Protocollo" value={`${TEST.shortName} · protocollo ${TEST.protocolVersion}`} />
          <ReadonlyValue label="Professionista" value={examinerName} />
        </div>

        <Field label="Altezza sedia (cm)" htmlFor={fieldId('setup.chairHeightCm')} error={visibleErrors['setup.chairHeightCm']}>
          <Input
            id={fieldId('setup.chairHeightCm')} type="number" inputMode="decimal" step="0.1" min="0"
            value={form.chairHeightCm} onChange={setField('chairHeightCm')}
          />
        </Field>

        {isVariant && (
          <VariantConfirm
            field="setup.variantConfirmed"
            message={`Altezza sedia non standard: la valutazione sarà salvata come variante e non sarà confrontabile con quelle a ${formatLength(STANDARD_CHAIR_CM)} cm.`}
            confirmLabel="Confermo l'altezza della sedia"
            checked={form.variantConfirmed}
            onChange={setField('variantConfirmed')}
            error={visibleErrors['setup.variantConfirmed']}
          />
        )}
        {isHeightChanged && (
          <WarningNote title="Sedia">
            Diversa dall'ultima valutazione ({formatLength(previousHeight)} cm il {formatShortDate(previous.performedAt)}).
          </WarningNote>
        )}

        <YesNoField
          label="Sedia con braccioli"
          id={fieldId('setup.chairHasArmrests')}
          value={form.chairHasArmrests}
          onChange={value => handleSetupFlag('chairHasArmrests', value)}
          error={visibleErrors['setup.chairHasArmrests']}
        />
        {form.chairHasArmrests && (
          <WarningNote title="Fuori protocollo">
            Sedia con braccioli: fuori protocollo standard, non sarà confrontabile con le valutazioni senza braccioli.
          </WarningNote>
        )}

        <YesNoField
          label="Braccia incrociate sul torace"
          id={fieldId('setup.armsCrossed')}
          value={form.armsCrossed}
          onChange={value => handleSetupFlag('armsCrossed', value)}
          error={visibleErrors['setup.armsCrossed']}
        />
        {form.armsCrossed === false && (
          <WarningNote title="Fuori protocollo">
            Braccia non incrociate: registra la deviazione dal protocollo in Chiusura.
          </WarningNote>
        )}
      </section>

      {/* B. Prova */}
      <section className="rx-card rounded-[4px] p-5 flex flex-col gap-4">
        <SectionLabel>◈ Prova ufficiale</SectionLabel>

        <YesNoField
          label="Familiarizzazione eseguita"
          id={fieldId('events.familiarizationDone')}
          value={form.familiarizationDone}
          onChange={value => setValue('familiarizationDone', value)}
          error={visibleErrors['events.familiarizationDone']}
          help="La prova di familiarizzazione non viene conteggiata."
        />

        <YesNoField
          label="Uso delle braccia per alzarsi"
          id={fieldId('events.usedArms')}
          value={form.usedArms}
          onChange={handleUsedArms}
          error={visibleErrors['events.usedArms']}
        />
        {form.usedArms && (
          <>
            <WarningNote title="Protocollo non valido">
              Con l'uso delle braccia il protocollo standard non si applica. Il risultato sarà registrato come 0 ripetizioni
              (regola CDC/STEADI), marcato INVALIDATO, senza confronto con la valutazione precedente né con la successiva. Non indica un'incapacità del paziente.
            </WarningNote>
            <Field label="Descrizione (facoltativa)" htmlFor={fieldId('events.usedArmsNote')} error={visibleErrors['events.usedArmsNote']}>
              <Textarea
                id={fieldId('events.usedArmsNote')} maxLength={TEXT_LIMITS.usedArmsNote}
                value={form.usedArmsNote} onChange={setField('usedArmsNote')}
              />
            </Field>
          </>
        )}

        {!form.usedArms && (
          <YesNoField
            label="Stop anticipato"
            id={fieldId('events.stoppedEarly')}
            value={form.stoppedEarly}
            onChange={handleStopped}
            error={visibleErrors['events.stoppedEarly']}
          />
        )}
        {isStopped && (
          <StopReasonFields
            options={TEST.stopReasonOptions}
            code={form.stopReasonCode} note={form.stopReasonNote}
            onChangeCode={setField('stopReasonCode')} onChangeNote={setField('stopReasonNote')}
            errors={visibleErrors}
            timeField={(
              <Field label={`Tempo raggiunto (s, 1–${MAX_STOP_TIME_S})`} htmlFor={fieldId('events.stopTimeS')} error={visibleErrors['events.stopTimeS']}>
                <Input
                  id={fieldId('events.stopTimeS')} type="number" inputMode="numeric" step="1" min="1" max={MAX_STOP_TIME_S}
                  value={form.stopTimeS} onChange={setField('stopTimeS')}
                />
              </Field>
            )}
          />
        )}

        <Field
          label={form.usedArms ? "Alzate complete prima dell'uso delle braccia (facoltativo)" : `Ripetizioni complete${stoppedSuffix}`}
          htmlFor={fieldId('trial.completeRepetitions')} error={visibleErrors['trial.completeRepetitions']}
        >
          <StepperInput
            id={fieldId('trial.completeRepetitions')} value={form.completeRepetitions}
            onChange={setField('completeRepetitions')} onStep={handleStepRepetitions}
            decreaseLabel="Diminuisci le ripetizioni" increaseLabel="Aumenta le ripetizioni" describedBy="assessment-repetitions-help"
          />
        </Field>
        <p id="assessment-repetitions-help" className="font-body text-[12px] m-0 -mt-2" style={{ color: 'var(--rx-text-muted)' }}>
          Conta un'alzata quando il paziente raggiunge la stazione eretta completa.
        </p>

        {!form.usedArms && !isStopped && (
          <YesNoField
            label="Ripetizione parziale finale"
            id={fieldId('trial.partialRepCounted')}
            value={form.partialRepCounted}
            onChange={value => setValue('partialRepCounted', value)}
            error={visibleErrors['trial.partialRepCounted']}
            help={`Allo scadere dei ${DURATION_S} s era oltre metà dell'alzata? Se sì, conta come ripetizione.`}
          />
        )}

        <YesNoField
          label="Errore tecnico"
          id={fieldId('events.technicalError')}
          value={form.technicalError}
          onChange={value => setValue('technicalError', value)}
          error={visibleErrors['events.technicalError']}
          help="Es. cronometro avviato in ritardo, errore di conteggio. Diverso dalla deviazione dal protocollo."
        />
        {form.technicalError && (
          <Field label="Descrizione dell'errore tecnico" htmlFor={fieldId('events.technicalErrorNote')} error={visibleErrors['events.technicalErrorNote']}>
            <Textarea
              id={fieldId('events.technicalErrorNote')} maxLength={TEXT_LIMITS.technicalErrorNote}
              value={form.technicalErrorNote} onChange={setField('technicalErrorNote')}
            />
          </Field>
        )}

        <PauseFields form={form} errors={visibleErrors} setField={setField} />
      </section>

      {/* C. Parametri clinici facoltativi */}
      <ClinicalSection
        rows={TEST.clinicalRows} form={form} errors={visibleErrors}
        isOpen={isClinicalOpen} onToggle={() => setIsClinicalOpen(open => !open)}
        filledCount={countSitToStandClinicalFilled(form)} setClinical={setClinical} setField={setField}
      />

      {/* D. Chiusura */}
      <ClosingSection
        form={form} errors={visibleErrors} setField={setField} setValue={setValue}
        deviationLock={isDeviationLocked ? DEVIATION_LOCK_HELP : undefined}
      />
    </AssessmentFormShell>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function ResultSummary({ preview, input }) {
  const { usedArms, stopTimeS } = input.events
  const { completeRepetitions, partialRepCounted } = input.trial
  return (
    <div aria-live="polite" className="flex flex-col gap-0.5">
      {preview && stopTimeS !== null && !usedArms && (
        <span className="font-display text-[10px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--rx-warning)' }}>
          INTERROTTA a {stopTimeS} s
        </span>
      )}
      <span className="font-display font-black text-[28px] text-white leading-none">
        {preview ? formatRepetitions(preview) : '—'}
      </span>
      {preview && usedArms && (
        <span className="font-display text-[10px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--rx-warning)' }}>
          INVALIDATO · uso delle braccia
        </span>
      )}
      {preview && !usedArms && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          {completeRepetitions} complete{partialRepCounted ? ' + 1 parziale finale' : ''}
        </span>
      )}
    </div>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

function formatRepetitions(preview) {
  const label = `${formatNumber(preview.repetitions)} ripetizion${preview.repetitions === 1 ? 'e' : 'i'}`
  return preview.durationS === null ? label : `${label} / ${preview.durationS} s`
}

function describeOutcome(input) {
  if (input.events.usedArms) return 'INVALIDATO · uso delle braccia'
  if (input.events.stopTimeS !== null) return `Interrotta a ${input.events.stopTimeS} s`
  return `Completa · ${DURATION_S} s`
}
