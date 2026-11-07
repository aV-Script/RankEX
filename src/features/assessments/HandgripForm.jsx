import { useState, useCallback } from 'react'
import { Field, Input, SectionLabel, WarningNote } from '../../components/ui'
import { HANDGRIP, LIPEDEMA_TEST_IDS, TEXT_LIMITS } from '../../utils/lipedema'
import { buildHandgripInput, getHandgripFieldOrder, deviceModelKeyOf, gripSettingKeyOf } from './handgripFormModel'
import { fieldId } from './formModelUtils'
import { useAssessmentForm }   from './useAssessmentForm'
import { useBilateralTrials, useTrialExtras } from './useBilateralTrials'
import { AssessmentFormShell } from './AssessmentFormShell'
import { ChoiceField, ReadonlyValue, ClinicalSection, ClosingSection } from './AssessmentFormFields'
import {
  BilateralConfirmSummary, BilateralSummary, BilateralTrialsSection, DeviceFields, NativeUnitField,
} from './BilateralFormParts'
import { formatShortDate } from './assessmentFormat'
import { LIPEDEMA_TESTS, DOMINANT_SIDE_OPTIONS } from '../../config/lipedemaTests.config'

const TEST = LIPEDEMA_TESTS[LIPEDEMA_TEST_IDS.HANDGRIP]
const TRIALS_INTRO = 'Destra e sinistra alternate, circa 60 s di recupero prima di ritestare la stessa mano. Contrazione massimale di circa 3 s.'

/**
 * Nuova valutazione Handgrip a schermo intero (ADR-016): prove, anteprima e stop
 * sono quelli comuni ai test bilaterali, qui il setup del dinamometro a mano.
 * Dolore per prova, facoltativo: il massimo per mano lo deriva il server.
 * @param {object|null} props.previous — ultima Handgrip valida (precompilazione + avviso dinamometro)
 */
export function HandgripForm({ client, examinerName, initialForm, supersedes, visit, previous, onSave, onBack, onPrivacyNoticeMissing, onDirtyChange }) {
  const [isClinicalOpen, setIsClinicalOpen] = useState(() => initialForm.conditionsNote.trim() !== '')
  const extrasState = useTrialExtras(initialForm.trials)
  const { revealTrialField } = extrasState

  // Apre la riga o la sezione che contiene il primo errore, prima del focus
  const handleRevealField = useCallback((field, currentForm) => {
    if (field === 'clinical.conditionsNote') setIsClinicalOpen(true)
    revealTrialField(field, currentForm)
  }, [revealTrialField])

  const formState = useAssessmentForm({
    initialForm, buildInput: buildHandgripInput, getFieldOrder: getHandgripFieldOrder,
    onRevealField: handleRevealField, birthDate: client.dataNascita ?? null, supersedes, visit,
    onSave, onBack, onPrivacyNoticeMissing, onDirtyChange,
  })
  const { form, setField, setValue, setClinical, visibleErrors, nowLocal } = formState
  const trialsState = useBilateralTrials({ formState, spec: HANDGRIP })

  const hasPreviousSetup = Boolean(previous) && !supersedes
  const isDeviceChanged  = hasPreviousSetup && form.deviceBrand.trim() !== '' && form.deviceModel.trim() !== '' && (
    deviceModelKeyOf(form.deviceBrand, form.deviceModel) !== previous.comparability?.deviceModelKey ||
    gripSettingKeyOf(form.gripSetting) !== previous.comparability?.gripSettingKey
  )

  return (
    <AssessmentFormShell
      test={TEST}
      client={client}
      supersedes={supersedes}
      visit={visit}
      formState={formState}
      onBack={onBack}
      summary={<BilateralSummary spec={HANDGRIP} formState={formState} trialsState={trialsState} />}
      confirmSummary={<BilateralConfirmSummary test={TEST} spec={HANDGRIP} formState={formState} trialsState={trialsState} />}
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

        {hasPreviousSetup && (
          <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            Dinamometro, impugnatura, mano dominante e unità precompilati dalla valutazione del {formatShortDate(previous.performedAt)}.
          </p>
        )}

        <DeviceFields form={form} errors={visibleErrors} setField={setField} />

        <Field label="Impugnatura" htmlFor={fieldId('setup.gripSetting')} error={visibleErrors['setup.gripSetting']}>
          <Input
            id={fieldId('setup.gripSetting')} maxLength={TEXT_LIMITS.gripSetting} placeholder="Es. posizione 2"
            value={form.gripSetting} onChange={setField('gripSetting')}
          />
        </Field>

        {isDeviceChanged && (
          <WarningNote title="Non confrontabile">
            Dinamometro o impugnatura diversi dall'ultima valutazione: non sarà confrontabile con quella.
          </WarningNote>
        )}

        <ChoiceField
          label="Mano dominante" id={fieldId('setup.dominantSide')}
          options={DOMINANT_SIDE_OPTIONS} value={form.dominantSide}
          onChange={value => setValue('dominantSide', value)} error={visibleErrors['setup.dominantSide']}
        />

        <NativeUnitField spec={HANDGRIP} form={form} errors={visibleErrors} trialsState={trialsState} />
      </section>

      {/* B. Prove */}
      <BilateralTrialsSection
        test={TEST} spec={HANDGRIP} intro={TRIALS_INTRO} supersedes={supersedes}
        formState={formState} trialsState={trialsState} extrasState={extrasState}
      />

      {/* C. Clinici: il dolore è per prova; qui solo le condizioni concomitanti */}
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
