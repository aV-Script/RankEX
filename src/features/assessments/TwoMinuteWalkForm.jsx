import { useState, useMemo, useCallback } from 'react'
import { Field, Input, SectionLabel } from '../../components/ui'
import { computeTwoMinuteWalkResult, TWO_MINUTE_WALK, LIPEDEMA_TEST_IDS, TEXT_LIMITS } from '../../utils/lipedema'
import {
  buildTwoMinuteWalkInput, countClinicalFilled, fieldId, getTwoMinuteWalkFieldOrder, RESULT_FIELDS,
} from './twoMinuteWalkFormModel'
import { useAssessmentForm }   from './useAssessmentForm'
import { AssessmentFormShell } from './AssessmentFormShell'
import {
  YesNoField, ReadonlyValue, VariantConfirm, StopReasonFields, PauseFields, ClinicalSection, ClosingSection, StepperInput,
} from './AssessmentFormFields'
import { formatNumber, formatLength } from './assessmentFormat'
import { LIPEDEMA_TESTS, ASSISTIVE_DEVICE_OPTIONS } from '../../config/lipedemaTests.config'

const TEST = LIPEDEMA_TESTS[LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]
const MAX_STOP_TIME_S = TWO_MINUTE_WALK.durationS - 1
// Errori dentro la sezione clinica collassata (il motivo di stop sta nella prova)
const STOP_FIELDS = ['clinical.stopReasonCode', 'clinical.stopReasonNote']

/**
 * Nuova valutazione 2MWT a schermo intero (vista professionista, modulo lipedema).
 * Una sola prova ufficiale, input a tratti cono→cono + frazione (ADR-015 §7):
 * il riepilogo mostra la stessa distanza che il server salverà (utils/lipedema.js
 * è la copia del calcolo di functions/src/shared/lipedema.js).
 * Con `supersedes` è una correzione: salvando si annulla la valutazione indicata
 * (motivo obbligatorio) e si salva questa nella stessa transazione; una
 * correzione identica all'originale non si salva.
 * `onDirtyChange(boolean)`: il genitore chiede conferma prima di smontare un
 * form modificato (tab, back dell'header).
 */
export function TwoMinuteWalkForm({ client, examinerName, initialForm, supersedes, onSave, onBack, onPrivacyNoticeMissing, onDirtyChange }) {
  const [isClinicalOpen, setIsClinicalOpen] = useState(() => countClinicalFilled(initialForm) > 0)

  const handleRevealField = useCallback((field) => {
    if (field.startsWith('clinical.') && !STOP_FIELDS.includes(field)) setIsClinicalOpen(true)
  }, [])

  const formState = useAssessmentForm({
    initialForm, buildInput: buildTwoMinuteWalkInput, getFieldOrder: getTwoMinuteWalkFieldOrder,
    onRevealField: handleRevealField, birthDate: client.dataNascita ?? null, supersedes,
    onSave, onBack, onPrivacyNoticeMissing, onDirtyChange,
  })
  const { form, setField, setValue, setClinical, setForm, input, errors, visibleErrors, nowLocal } = formState

  const preview = useMemo(() => {
    if (RESULT_FIELDS.some(field => errors[field]) || input.setup.courseLengthM === null || input.trial.partialDistanceM === null) return null
    return computeTwoMinuteWalkResult({
      courseLengthM:    input.setup.courseLengthM,
      fullLengths:      input.trial.fullLengths,
      partialDistanceM: input.trial.partialDistanceM,
      durationS:        input.events.stopTimeS ?? TWO_MINUTE_WALK.durationS,
    })
  }, [errors, input])

  const courseLength  = input.setup.courseLengthM
  const isCourseValid = !errors['setup.courseLengthM'] && courseLength !== null
  const isVariant     = isCourseValid && courseLength !== TWO_MINUTE_WALK.standardCourseLengthM

  const handleStepLengths = useCallback((delta) => {
    setForm(prev => {
      const current = Number.parseInt(prev.fullLengths, 10)
      const next    = Math.max(0, (Number.isNaN(current) ? 0 : current) + delta)
      return { ...prev, fullLengths: String(next) }
    })
  }, [setForm])

  const stoppedSuffix = form.stoppedEarly ? " fino all'interruzione" : ''

  return (
    <AssessmentFormShell
      test={TEST}
      client={client}
      supersedes={supersedes}
      formState={formState}
      onBack={onBack}
      summary={<ResultSummary preview={preview} input={input} isStopped={form.stoppedEarly} />}
      confirmSummary={(
        <>
          <span className="font-display font-black text-[20px] text-white">
            {preview ? `${formatNumber(preview.distanceM)} m` : '—'}
          </span>
          <span>
            {form.stoppedEarly ? `Interrotta a ${input.events.stopTimeS} s` : `Completa · ${TWO_MINUTE_WALK.durationS} s`}
            {isVariant ? ` · variante ${formatLength(courseLength)} m` : ''}
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

        <Field label="Lunghezza percorso (m)" htmlFor={fieldId('setup.courseLengthM')} error={visibleErrors['setup.courseLengthM']}>
          <Input
            id={fieldId('setup.courseLengthM')} type="number" inputMode="decimal" step="0.1" min="0"
            value={form.courseLengthM} onChange={setField('courseLengthM')}
          />
        </Field>

        {isVariant && (
          <VariantConfirm
            field="setup.variantConfirmed"
            message={`Percorso non standard: questa valutazione sarà salvata come variante e non sarà confrontabile con quelle su ${TWO_MINUTE_WALK.standardCourseLengthM} m.`}
            confirmLabel="Confermo la variante di percorso"
            checked={form.variantConfirmed}
            onChange={setField('variantConfirmed')}
            error={visibleErrors['setup.variantConfirmed']}
          />
        )}

        <Field label="Ausilio" htmlFor={fieldId('setup.assistiveDevice')} error={visibleErrors['setup.assistiveDevice']}>
          <select id={fieldId('setup.assistiveDevice')} className="input-base" value={form.assistiveDevice} onChange={setField('assistiveDevice')}>
            {ASSISTIVE_DEVICE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>

        {form.assistiveDevice === 'other' && (
          <Field label="Descrizione ausilio" htmlFor={fieldId('setup.assistiveDeviceNote')} error={visibleErrors['setup.assistiveDeviceNote']}>
            <Input
              id={fieldId('setup.assistiveDeviceNote')} maxLength={TEXT_LIMITS.assistiveDeviceNote}
              value={form.assistiveDeviceNote} onChange={setField('assistiveDeviceNote')}
            />
          </Field>
        )}
      </section>

      {/* B. Prova */}
      <section className="rx-card rounded-[4px] p-5 flex flex-col gap-4">
        <SectionLabel>◈ Prova ufficiale</SectionLabel>

        <YesNoField
          label="Stop anticipato"
          id={fieldId('events.stoppedEarly')}
          value={form.stoppedEarly}
          onChange={value => setValue('stoppedEarly', value)}
          error={visibleErrors['events.stoppedEarly']}
        />

        {form.stoppedEarly && (
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

        <Field label={`Tratti completi cono→cono${stoppedSuffix}`} htmlFor={fieldId('trial.fullLengths')} error={visibleErrors['trial.fullLengths']}>
          <StepperInput
            id={fieldId('trial.fullLengths')} value={form.fullLengths} onChange={setField('fullLengths')} onStep={handleStepLengths}
            decreaseLabel="Diminuisci i tratti" increaseLabel="Aumenta i tratti" describedBy="assessment-fullLengths-help"
          />
        </Field>
        <p id="assessment-fullLengths-help" className="font-body text-[12px] m-0 -mt-2" style={{ color: 'var(--rx-text-muted)' }}>
          Conta ogni passaggio da un cono all'altro, non il giro andata e ritorno.
        </p>

        <Field label={`Frazione finale (m)${stoppedSuffix}`} htmlFor={fieldId('trial.partialDistanceM')} error={visibleErrors['trial.partialDistanceM']}>
          <Input
            id={fieldId('trial.partialDistanceM')} type="number" inputMode="decimal" step="0.1" min="0"
            value={form.partialDistanceM} onChange={setField('partialDistanceM')}
          />
        </Field>

        <PauseFields form={form} errors={visibleErrors} setField={setField} />
      </section>

      {/* C. Parametri clinici facoltativi */}
      <ClinicalSection
        rows={TEST.clinicalRows} form={form} errors={visibleErrors}
        isOpen={isClinicalOpen} onToggle={() => setIsClinicalOpen(open => !open)}
        filledCount={countClinicalFilled(form)} setClinical={setClinical} setField={setField}
      />

      {/* D. Chiusura */}
      <ClosingSection form={form} errors={visibleErrors} setField={setField} setValue={setValue} />
    </AssessmentFormShell>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function ResultSummary({ preview, input, isStopped }) {
  const { courseLengthM } = input.setup
  const { fullLengths, partialDistanceM } = input.trial
  return (
    <div aria-live="polite" className="flex flex-col gap-0.5">
      {isStopped && preview && (
        <span className="font-display text-[10px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--rx-warning)' }}>
          INTERROTTA a {input.events.stopTimeS} s · {formatNumber(preview.distanceM)} m
        </span>
      )}
      <span className="font-display font-black text-[28px] text-white leading-none">
        {preview ? `${formatNumber(preview.distanceM)} m` : '—'}
      </span>
      {preview && (
        <>
          <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
            {fullLengths} × {formatLength(courseLengthM)} m + {formatNumber(partialDistanceM, 1)} m, arrotondato al metro
          </span>
          <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
            Velocità media {formatNumber(preview.avgSpeedMs, 2)} m/s
          </span>
        </>
      )}
    </div>
  )
}
