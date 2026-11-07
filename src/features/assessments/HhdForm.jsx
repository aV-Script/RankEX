import { useState, useCallback } from 'react'
import { Field, Input, SectionLabel, WarningNote } from '../../components/ui'
import { HHD_QUADRICEPS, LIPEDEMA_TEST_IDS, TEXT_LIMITS } from '../../utils/lipedema'
import {
  applyContractionChange, buildHhdInput, getHhdComparabilityWarnings, getHhdFieldOrder, isHhdDeviationRequired,
} from './hhdFormModel'
import { fieldId } from './formModelUtils'
import { useAssessmentForm }   from './useAssessmentForm'
import { useBilateralTrials, useTrialExtras } from './useBilateralTrials'
import { AssessmentFormShell } from './AssessmentFormShell'
import { ChoiceField, ReadonlyValue, ClinicalSection, ClosingSection } from './AssessmentFormFields'
import {
  BilateralConfirmSummary, BilateralSummary, BilateralTrialsSection, DeviceFields, NativeUnitField, PrecompiledLegNotice,
} from './BilateralFormParts'
import { formatShortDate } from './assessmentFormat'
import {
  LIPEDEMA_TESTS, ASSISTIVE_DEVICE_OPTIONS, COMPARABILITY_REASON_LABELS, DOMINANT_SIDE_OPTIONS, FIXATION_OPTIONS,
  SENSOR_POSITION_OPTIONS,
} from '../../config/lipedemaTests.config'

const TEST = LIPEDEMA_TESTS[LIPEDEMA_TEST_IDS.HHD_QUADRICEPS]
const { standardContractionS } = HHD_QUADRICEPS
const TRIALS_INTRO = `Destra e sinistra alternate, circa 60 s di recupero prima di ritestare la stessa gamba. Contrazione massimale di circa ${standardContractionS} s.`
const DEVIATION_LOCK_HELP = `Contrazione diversa da ${standardContractionS} s: la deviazione è obbligatoria, descrivila.`

/**
 * Nuova valutazione HHD quadricipite a schermo intero (ADR-017): prove, anteprima
 * e stop sono quelli comuni ai test bilaterali, qui il setup. Il fissaggio è unico
 * per entrambe le gambe, per costruzione. Ogni parametro che rompe la
 * comparabilità con l'ultima valutazione è segnalato prima di salvare.
 * @param {object|null} props.previous — ultima HHD valida (precompilazione + avviso)
 */
export function HhdForm({ client, examinerName, initialForm, supersedes, visit, previous, onSave, onBack, onPrivacyNoticeMissing, onDirtyChange }) {
  const [isClinicalOpen, setIsClinicalOpen] = useState(() => initialForm.conditionsNote.trim() !== '')
  const extrasState = useTrialExtras(initialForm.trials)
  const { revealTrialField } = extrasState

  // Apre la riga o la sezione che contiene il primo errore, prima del focus
  const handleRevealField = useCallback((field, currentForm) => {
    if (field === 'clinical.conditionsNote') setIsClinicalOpen(true)
    revealTrialField(field, currentForm)
  }, [revealTrialField])

  const formState = useAssessmentForm({
    initialForm, buildInput: buildHhdInput, getFieldOrder: getHhdFieldOrder,
    onRevealField: handleRevealField, birthDate: client.dataNascita ?? null, supersedes, visit,
    onSave, onBack, onPrivacyNoticeMissing, onDirtyChange,
  })
  const { form, setForm, setField, setValue, setClinical, errors, visibleErrors, nowLocal } = formState
  const trialsState = useBilateralTrials({ formState, spec: HHD_QUADRICEPS })

  // Contrazione fuori protocollo: attiva la deviazione (il server la richiede)
  const handleContractionChange = useCallback((event) => {
    const { value } = event.target
    setForm(prev => applyContractionChange(prev, value))
  }, [setForm])

  const hasPrecompiledSetup = Boolean(previous) && !supersedes
  // Anche in correzione: previous esclude la valutazione che si sta correggendo
  const comparabilityIssues = getHhdComparabilityWarnings(form, errors, previous)

  return (
    <AssessmentFormShell
      test={TEST}
      client={client}
      supersedes={supersedes}
      visit={visit}
      formState={formState}
      onBack={onBack}
      summary={<BilateralSummary spec={HHD_QUADRICEPS} formState={formState} trialsState={trialsState} />}
      confirmSummary={<BilateralConfirmSummary test={TEST} spec={HHD_QUADRICEPS} formState={formState} trialsState={trialsState} />}
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

        {hasPrecompiledSetup && (
          <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            Dinamometro, fissaggio, posizione e unità precompilati dalla valutazione del {formatShortDate(previous.performedAt)}.
          </p>
        )}
        <PrecompiledLegNotice initialForm={initialForm} supersedes={supersedes} />

        <DeviceFields form={form} errors={visibleErrors} setField={setField} />

        <div className="flex flex-col gap-1">
          <ChoiceField
            label="Fissaggio" id={fieldId('setup.fixationMethod')}
            options={FIXATION_OPTIONS} value={form.fixationMethod}
            onChange={value => setValue('fixationMethod', value)} error={visibleErrors['setup.fixationMethod']}
          />
          <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            Lo stesso per entrambe le gambe. Cinghia esterna raccomandata dal protocollo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Angolo ginocchio (°)" htmlFor={fieldId('setup.kneeAngleDeg')} error={visibleErrors['setup.kneeAngleDeg']}>
            <Input id={fieldId('setup.kneeAngleDeg')} type="number" inputMode="numeric" step="1" min="0" max={HHD_QUADRICEPS.maxAngleDeg} value={form.kneeAngleDeg} onChange={setField('kneeAngleDeg')} />
          </Field>
          <Field label="Angolo anca (°)" htmlFor={fieldId('setup.hipAngleDeg')} error={visibleErrors['setup.hipAngleDeg']}>
            <Input id={fieldId('setup.hipAngleDeg')} type="number" inputMode="numeric" step="1" min="0" max={HHD_QUADRICEPS.maxAngleDeg} value={form.hipAngleDeg} onChange={setField('hipAngleDeg')} />
          </Field>
          <Field label="Contrazione (s)" htmlFor={fieldId('setup.contractionS')} error={visibleErrors['setup.contractionS']}>
            <Input id={fieldId('setup.contractionS')} type="number" inputMode="decimal" step="0.1" min="0" max={HHD_QUADRICEPS.maxContractionS} value={form.contractionS} onChange={handleContractionChange} />
          </Field>
        </div>

        <Field label="Punto del sensore" htmlFor={fieldId('setup.sensorPosition')} error={visibleErrors['setup.sensorPosition']}>
          <select id={fieldId('setup.sensorPosition')} className="input-base" value={form.sensorPosition} onChange={setField('sensorPosition')}>
            {SENSOR_POSITION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        {form.sensorPosition === 'other' && (
          <Field label="Descrizione del punto" htmlFor={fieldId('setup.sensorPositionNote')} error={visibleErrors['setup.sensorPositionNote']}>
            <Input id={fieldId('setup.sensorPositionNote')} maxLength={TEXT_LIMITS.sensorPositionNote} value={form.sensorPositionNote} onChange={setField('sensorPositionNote')} />
          </Field>
        )}

        {comparabilityIssues.length > 0 && (
          <WarningNote title="Non confrontabile">
            {comparabilityIssues.map(reason => COMPARABILITY_REASON_LABELS[reason] ?? reason).join(', ')} rispetto all'ultima valutazione: non sarà confrontabile con quella.
          </WarningNote>
        )}

        <ChoiceField
          label="Gamba dominante" id={fieldId('setup.dominantSide')}
          options={DOMINANT_SIDE_OPTIONS} value={form.dominantSide}
          onChange={value => setValue('dominantSide', value)} error={visibleErrors['setup.dominantSide']}
        />

        <NativeUnitField spec={HHD_QUADRICEPS} form={form} errors={visibleErrors} trialsState={trialsState} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Dolore pre-test (NRS 0–10, facoltativo)" htmlFor={fieldId('clinical.painPre')} error={visibleErrors['clinical.painPre']}>
            <Input id={fieldId('clinical.painPre')} type="number" inputMode="numeric" step="1" min="0" max="10" value={form.clinical.painPre} onChange={setClinical('painPre')} />
          </Field>
          <Field label="Ausilio" htmlFor={fieldId('setup.assistiveDevice')} error={visibleErrors['setup.assistiveDevice']}>
            <select id={fieldId('setup.assistiveDevice')} className="input-base" value={form.assistiveDevice} onChange={setField('assistiveDevice')}>
              {ASSISTIVE_DEVICE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
        </div>
        {form.assistiveDevice === 'other' && (
          <Field label="Descrizione dell'ausilio" htmlFor={fieldId('setup.assistiveDeviceNote')} error={visibleErrors['setup.assistiveDeviceNote']}>
            <Input id={fieldId('setup.assistiveDeviceNote')} maxLength={TEXT_LIMITS.assistiveDeviceNote} value={form.assistiveDeviceNote} onChange={setField('assistiveDeviceNote')} />
          </Field>
        )}
      </section>

      {/* B. Prove */}
      <BilateralTrialsSection
        test={TEST} spec={HHD_QUADRICEPS} intro={TRIALS_INTRO} supersedes={supersedes}
        formState={formState} trialsState={trialsState} extrasState={extrasState}
      />

      {/* C. Clinici: il dolore è per prova e pre-test; qui le condizioni concomitanti */}
      <ClinicalSection
        rows={TEST.clinicalRows} form={form} errors={visibleErrors}
        isOpen={isClinicalOpen} onToggle={() => setIsClinicalOpen(open => !open)}
        filledCount={form.conditionsNote.trim() ? 1 : 0} setClinical={setClinical} setField={setField}
      />

      {/* D. Chiusura */}
      <ClosingSection
        form={form} errors={visibleErrors} setField={setField} setValue={setValue}
        deviationLock={isHhdDeviationRequired(form) ? DEVIATION_LOCK_HELP : undefined}
      />
    </AssessmentFormShell>
  )
}
