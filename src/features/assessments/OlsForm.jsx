import { useState, useCallback } from 'react'
import { Field, Input, SectionLabel, WarningNote } from '../../components/ui'
import { BILATERAL_TESTS, ONE_LEG_STANDING, LIPEDEMA_TEST_IDS, TEXT_LIMITS } from '../../utils/lipedema'
import { applyOlsRowPatch, buildOlsInput, getOlsComparabilityWarnings, getOlsFieldOrder } from './olsFormModel'
import { fieldId } from './formModelUtils'
import { useAssessmentForm }   from './useAssessmentForm'
import { useBilateralTrials, useTrialExtras } from './useBilateralTrials'
import { AssessmentFormShell } from './AssessmentFormShell'
import { ChoiceField, ReadonlyValue, ClinicalSection, ClosingSection } from './AssessmentFormFields'
import { BilateralConfirmSummary, BilateralSummary, BilateralTrialsSection, PrecompiledLegNotice } from './BilateralFormParts'
import { formatNumber, formatShortDate } from './assessmentFormat'
import {
  LIPEDEMA_TESTS, ASSISTIVE_DEVICE_OPTIONS, COMPARABILITY_REASON_LABELS, DOMINANT_SIDE_OPTIONS, FOOTWEAR_OPTIONS,
  SURFACE_OPTIONS,
} from '../../config/lipedemaTests.config'

const TEST = LIPEDEMA_TESTS[LIPEDEMA_TEST_IDS.ONE_LEG_STANDING]
const MAX_DURATION_LABEL = `${formatNumber(ONE_LEG_STANDING.ceiling, BILATERAL_TESTS[TEST.id].displayDecimals)} s`
const TRIALS_INTRO = `Occhi aperti, braccia lungo i fianchi, nessun ausilio. ${ONE_LEG_STANDING.validTrialsPerSide} prove valide per gamba, alternate D-S-D-S, massimo ${MAX_DURATION_LABEL} per prova. Tempo in secondi, con un decimale.`

/**
 * Nuova valutazione One-Leg Standing a schermo intero (ADR-018): prove, anteprima e
 * stop sono quelli comuni ai test bilaterali, qui setup e dolore. La durata massima
 * è del protocollo, non si modifica: un limite diverso è un altro protocollo.
 * @param {object|null} props.previous — ultimo OLS valido (precompilazione + avviso)
 */
export function OlsForm({ client, examinerName, initialForm, supersedes, visit, previous, onSave, onBack, onPrivacyNoticeMissing, onDirtyChange }) {
  const [isClinicalOpen, setIsClinicalOpen] = useState(() => initialForm.conditionsNote.trim() !== '')
  const extrasState = useTrialExtras(initialForm.trials)
  const { revealTrialField } = extrasState

  // Apre la riga o la sezione che contiene il primo errore, prima del focus
  const handleRevealField = useCallback((field, currentForm) => {
    if (field === 'clinical.conditionsNote') setIsClinicalOpen(true)
    revealTrialField(field, currentForm)
  }, [revealTrialField])

  const formState = useAssessmentForm({
    initialForm, buildInput: buildOlsInput, getFieldOrder: getOlsFieldOrder,
    onRevealField: handleRevealField, birthDate: client.dataNascita ?? null, supersedes, visit,
    onSave, onBack, onPrivacyNoticeMissing, onDirtyChange,
  })
  const { form, setField, setValue, setClinical, errors, visibleErrors, nowLocal } = formState
  const trialsState = useBilateralTrials({ formState, spec: ONE_LEG_STANDING, onRowPatch: applyOlsRowPatch })

  const hasPrecompiledSetup = Boolean(previous) && !supersedes
  // Anche in correzione: previous esclude la valutazione che si sta correggendo
  const comparabilityIssues = getOlsComparabilityWarnings(form, errors, previous)

  return (
    <AssessmentFormShell
      test={TEST}
      client={client}
      supersedes={supersedes}
      visit={visit}
      formState={formState}
      onBack={onBack}
      summary={<BilateralSummary spec={ONE_LEG_STANDING} formState={formState} trialsState={trialsState} />}
      confirmSummary={<BilateralConfirmSummary test={TEST} spec={ONE_LEG_STANDING} formState={formState} trialsState={trialsState} />}
    >
      {/* A. Setup */}
      <section className="rx-card rounded-[4px] p-5 flex flex-col gap-4">
        <SectionLabel>◈ Setup</SectionLabel>

        <Field label="Data e ora" htmlFor={fieldId('performedAt')} error={visibleErrors.performedAt}>
          <Input id={fieldId('performedAt')} type="datetime-local" max={nowLocal} value={form.performedAt} onChange={setField('performedAt')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ReadonlyValue label="Protocollo" value={`${TEST.shortName} · protocollo ${TEST.protocolVersion}`} />
          <ReadonlyValue label="Durata massima" value={MAX_DURATION_LABEL} />
          <ReadonlyValue label="Professionista" value={examinerName} />
        </div>

        {hasPrecompiledSetup && (
          <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            Calzature, superficie e ausilio precompilati dalla valutazione del {formatShortDate(previous.performedAt)}.
          </p>
        )}
        <PrecompiledLegNotice initialForm={initialForm} supersedes={supersedes} />

        <ChoiceField
          label="Gamba dominante" id={fieldId('setup.dominantSide')}
          options={DOMINANT_SIDE_OPTIONS} value={form.dominantSide}
          onChange={value => setValue('dominantSide', value)} error={visibleErrors['setup.dominantSide']}
        />

        <ChoiceField
          label="Calzature" id={fieldId('setup.footwear')}
          options={FOOTWEAR_OPTIONS} value={form.footwear}
          onChange={value => setValue('footwear', value)} error={visibleErrors['setup.footwear']}
        />

        <Field label="Superficie" htmlFor={fieldId('setup.surface')} error={visibleErrors['setup.surface']}>
          <select id={fieldId('setup.surface')} className="input-base" value={form.surface} onChange={setField('surface')}>
            {SURFACE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        {form.surface === 'other' && (
          <Field label="Descrizione della superficie" htmlFor={fieldId('setup.surfaceNote')} error={visibleErrors['setup.surfaceNote']}>
            <Input id={fieldId('setup.surfaceNote')} maxLength={TEXT_LIMITS.surfaceNote} value={form.surfaceNote} onChange={setField('surfaceNote')} />
          </Field>
        )}

        {comparabilityIssues.length > 0 && (
          <WarningNote title="Non confrontabile">
            {comparabilityIssues.map(reason => COMPARABILITY_REASON_LABELS[reason] ?? reason).join(', ')} rispetto all'ultima valutazione: non sarà confrontabile con quella.
          </WarningNote>
        )}

        <Field label="Ausilio abituale (non usato nella prova)" htmlFor={fieldId('setup.assistiveDevice')} error={visibleErrors['setup.assistiveDevice']}>
          <select id={fieldId('setup.assistiveDevice')} className="input-base" value={form.assistiveDevice} onChange={setField('assistiveDevice')}>
            {ASSISTIVE_DEVICE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        {form.assistiveDevice === 'other' && (
          <Field label="Descrizione dell'ausilio" htmlFor={fieldId('setup.assistiveDeviceNote')} error={visibleErrors['setup.assistiveDeviceNote']}>
            <Input id={fieldId('setup.assistiveDeviceNote')} maxLength={TEXT_LIMITS.assistiveDeviceNote} value={form.assistiveDeviceNote} onChange={setField('assistiveDeviceNote')} />
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
          <Field label="Dolore (NRS 0–10, facoltativo)" htmlFor={fieldId('clinical.pain')} error={visibleErrors['clinical.pain']}>
            <Input id={fieldId('clinical.pain')} type="number" inputMode="numeric" step="1" min="0" max="10" value={form.clinical.pain} onChange={setClinical('pain')} />
          </Field>
          <Field label="Sintomi (facoltativo)" htmlFor={fieldId('clinical.symptomsNote')} error={visibleErrors['clinical.symptomsNote']}>
            <Input id={fieldId('clinical.symptomsNote')} maxLength={TEXT_LIMITS.symptomsNote} value={form.clinical.symptomsNote} onChange={setClinical('symptomsNote')} />
          </Field>
        </div>
      </section>

      {/* B. Prove */}
      <BilateralTrialsSection
        test={TEST} spec={ONE_LEG_STANDING} intro={TRIALS_INTRO} supersedes={supersedes}
        formState={formState} trialsState={trialsState} extrasState={extrasState}
      />

      {/* C. Clinici: dolore e sintomi sono nel setup; qui le condizioni concomitanti */}
      <ClinicalSection
        rows={TEST.clinicalRows} form={form} errors={visibleErrors}
        isOpen={isClinicalOpen} onToggle={() => setIsClinicalOpen(open => !open)}
        filledCount={form.conditionsNote.trim() ? 1 : 0} setClinical={setClinical} setField={setField}
      />

      {/* D. Chiusura */}
      <ClosingSection form={form} errors={visibleErrors} setField={setField} setValue={setValue} />
    </AssessmentFormShell>
  )
}
