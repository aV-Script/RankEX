import { Badge, Button, Field, Input, SectionLabel, SegmentedToggle, WarningNote } from '../../components/ui'
import { BILATERAL_TESTS, TEXT_LIMITS, countLabel } from '../../utils/lipedema'
import { SIDE_LABELS, getStrongestLabel } from '../../config/lipedemaTests.config'
import { isEmptyTrialRow, countFilledTrialRows } from './bilateralFormModel'
import { fieldId } from './formModelUtils'
import { YesNoField, ChoiceField, StopReasonFields } from './AssessmentFormFields'
import { formatNumber } from './assessmentFormat'

const NATIVE_DECIMALS   = 1   // kgf letto mostrato con 1 decimale (ADR-016 §4)
const SYMMETRY_DECIMALS = 1

/**
 * Parti comuni ai form dei test bilaterali (Handgrip, HHD, OLS), con lo stato di
 * useBilateralTrials. Il nome dell'arto ("mano", "gamba") viene dal config del test.
 */

/** La gamba dominante può arrivare dall'altro test di gamba (ADR-016 §5): chi compila lo deve sapere */
export function PrecompiledLegNotice({ initialForm, supersedes }) {
  if (supersedes || !initialForm.dominantSide) return null
  return (
    <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
      Gamba dominante precompilata dall'ultima valutazione HHD o OLS: controlla che sia corretta.
    </p>
  )
}

/** Marca, modello e seriale del dinamometro */
export function DeviceFields({ form, errors, setField }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label="Marca dinamometro" htmlFor={fieldId('setup.device.brand')} error={errors['setup.device.brand']}>
        <Input id={fieldId('setup.device.brand')} maxLength={TEXT_LIMITS.deviceField} value={form.deviceBrand} onChange={setField('deviceBrand')} />
      </Field>
      <Field label="Modello" htmlFor={fieldId('setup.device.model')} error={errors['setup.device.model']}>
        <Input id={fieldId('setup.device.model')} maxLength={TEXT_LIMITS.deviceField} value={form.deviceModel} onChange={setField('deviceModel')} />
      </Field>
      <Field label="Seriale (facoltativo)" htmlFor={fieldId('setup.device.serial')} error={errors['setup.device.serial']}>
        <Input id={fieldId('setup.device.serial')} maxLength={TEXT_LIMITS.deviceField} value={form.deviceSerial} onChange={setField('deviceSerial')} />
      </Field>
    </div>
  )
}

/** Unità di inserimento, una per valutazione, con avviso se cambia a valori già scritti */
export function NativeUnitField({ spec, form, errors, trialsState }) {
  const options = Object.keys(spec.unitFactors).map(unit => ({ value: unit, label: unit }))
  return (
    <>
      <div className="flex flex-col gap-1">
        <ChoiceField
          label="Unità di inserimento" id={fieldId('setup.nativeUnit')}
          options={options} value={form.nativeUnit}
          onChange={trialsState.handleUnitChange} error={errors['setup.nativeUnit']}
        />
        <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
          Salvato in N (1 kgf = {String(spec.unitFactors.kgf).replace('.', ',')} N); il valore letto sullo strumento resta conservato.
        </p>
      </div>
      {trialsState.hasUnitWarning && (
        <WarningNote title="Unità">Verifica i valori: sono interpretati in {form.nativeUnit}.</WarningNote>
      )}
    </>
  )
}

/** Prove in ordine cronologico + stop anticipato */
export function BilateralTrialsSection({ test, spec, intro, supersedes, formState, trialsState, extrasState }) {
  const { form, visibleErrors, setField, setValue } = formState
  const { preview, inputIndexByKey, bestKeyBySide, maxTrials, incompleteSides, cappedSides, capNoticeKeys } = trialsState
  const limb = test.limbName
  return (
    <section id={fieldId('trials')} tabIndex={-1} className="rx-card rounded-[4px] p-5 flex flex-col gap-3 outline-none">
      <SectionLabel>◈ Prove</SectionLabel>
      <p className="font-body text-[12px] m-0 -mt-2" style={{ color: 'var(--rx-text-muted)' }}>{intro}</p>

      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {form.trials.map((row, index) => (
          <li key={row.key}>
            <TrialRow
              row={row}
              test={test}
              spec={spec}
              position={index + 1}
              repeatOfPosition={row.repeatOf ? form.trials.findIndex(item => item.key === row.repeatOf) + 1 : null}
              inputIndex={inputIndexByKey.get(row.key) ?? null}
              unit={form.nativeUnit}
              isBest={bestKeyBySide[row.side] === row.key}
              isExtrasOpen={extrasState.openExtras.has(row.key)}
              canMarkInvalid={!row.valid || !cappedSides.includes(row.side)}
              showCapNotice={capNoticeKeys.has(row.key)}
              canRemove={Boolean(supersedes) || Boolean(row.repeatOf) || (cappedSides.includes(row.side) && isEmptyTrialRow(row))}
              errors={visibleErrors}
              onChange={trialsState.updateRow}
              onToggleValid={trialsState.handleToggleValid}
              onToggleExtras={extrasState.handleToggleExtras}
              onRemove={trialsState.handleRemoveRow}
              onValueKeyDown={trialsState.handleValueKeyDown}
            />
          </li>
        ))}
      </ul>

      {supersedes && (
        <Button size="sm" variant="ghost" className="self-start" onClick={trialsState.handleAddRow} disabled={form.trials.length >= maxTrials}>
          + AGGIUNGI PROVA
        </Button>
      )}

      {!form.stoppedEarly && incompleteSides.map(side => (
        <p key={side} className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
          {preview.validCountBySide[side] > spec.validTrialsPerSide
            ? `Troppe prove valide per la ${limb} ${SIDE_LABELS[side].label} (${preview.validCountBySide[side]} su ${spec.validTrialsPerSide}): segna come non valida o rimuovi quella in più.`
            : `Servono ${spec.validTrialsPerSide} prove valide per la ${limb} ${SIDE_LABELS[side].label} (${preview.validCountBySide[side]} di ${spec.validTrialsPerSide}).`}
        </p>
      ))}
      {visibleErrors.trials && <p role="alert" className="m-0 text-red-400 font-body text-[12px]">{visibleErrors.trials}</p>}

      <YesNoField
        label="Stop anticipato"
        id={fieldId('events.stoppedEarly')}
        value={form.stoppedEarly}
        onChange={value => setValue('stoppedEarly', value)}
        error={visibleErrors['events.stoppedEarly']}
        help={form.stoppedEarly
          ? `Una ${limb} con meno di ${spec.validTrialsPerSide} prove valide resta senza best; le prove senza valore non saranno salvate.`
          : `Per dolore, sintomi o controindicazione: consente meno di ${spec.validTrialsPerSide} prove valide per ${limb}.`}
      />
      {form.stoppedEarly && (
        <StopReasonFields
          options={test.stopReasonOptions}
          code={form.stopReasonCode} note={form.stopReasonNote}
          onChangeCode={setField('stopReasonCode')} onChangeNote={setField('stopReasonNote')}
          errors={visibleErrors}
        />
      )}
    </section>
  )
}

/** Riepilogo live nella barra del form */
export function BilateralSummary({ spec, formState, trialsState }) {
  const { form, input } = formState
  const { preview, bestKeyBySide, inputIndexByKey } = trialsState
  const nativeBest = side => {
    const index = inputIndexByKey.get(bestKeyBySide[side])
    return index === undefined ? null : input.trials[index]?.nativeValue ?? null
  }
  const ceilingSides = spec.sides.filter(side => preview.ceilingBySide?.[side] === true)
  return (
    <div aria-live="polite" className="flex flex-col gap-0.5">
      <span className="font-display font-black text-[22px] text-white leading-tight">{formatBilateralSides(preview, spec, input.testId)}</span>
      {preview.strongestValue !== null && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          {getStrongestLabel(input.testId)}: {preview.strongestSide ? SIDE_LABELS[preview.strongestSide].label : 'pari'} · Simmetria {formatNumber(preview.symmetryPct, SYMMETRY_DECIMALS)} %
        </span>
      )}
      {ceilingSides.length > 0 && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          Tetto {spec.ceiling} s raggiunto: {ceilingSides.map(side => SIDE_LABELS[side].short).join(' · ')}
        </span>
      )}
      {form.nativeUnit === 'kgf' && spec.sides.some(side => nativeBest(side) !== null) && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          Letti: {spec.sides.filter(side => nativeBest(side) !== null).map(side => `${SIDE_LABELS[side].short} ${formatNumber(nativeBest(side), NATIVE_DECIMALS)} kgf`).join(' · ')}
        </span>
      )}
      <span className="sr-only">{countLabel(countFilledTrialRows(form.trials), 'prova inserita', 'prove inserite')}</span>
    </div>
  )
}

/** Riepilogo nel dialog di conferma */
export function BilateralConfirmSummary({ test, spec, formState, trialsState }) {
  const { form, input } = formState
  const hasUnitChoice = Object.keys(spec.unitFactors).length > 1
  return (
    <>
      <span className="font-display font-black text-[20px] text-white">{formatBilateralSides(trialsState.preview, spec, input.testId)}</span>
      <span>{form.stoppedEarly ? 'Interrotta' : `Completa · ${spec.validTrialsPerSide} prove valide per ${test.limbName}`}{hasUnitChoice ? ` · unità ${form.nativeUnit}` : ''}</span>
    </>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function TrialRow({
  row, test, spec, position, repeatOfPosition, inputIndex, unit, isBest, isExtrasOpen, canMarkInvalid, showCapNotice, canRemove, errors,
  onChange, onToggleValid, onToggleExtras, onRemove, onValueKeyDown,
}) {
  const field   = name => (inputIndex === null ? `trial-row-${row.key}.${name}` : `trials.${inputIndex}.${name}`)
  const errorOf = name => (inputIndex === null ? undefined : errors[`trials.${inputIndex}.${name}`])
  const value   = Number(String(row.nativeValue).replace(',', '.'))
  const hasValue = row.nativeValue.trim() !== '' && Number.isFinite(value) && value > 0
  const valueError = errorOf('nativeValue') ?? errorOf('valid') ?? errorOf('seq') ?? errorOf('side')
  const sideLabel = SIDE_LABELS[row.side]
  const isCeiling = row.valid && hasValue && value === spec.ceiling
  const hasTrialPain = test.hasTrialPain !== false
  const extrasName = hasTrialPain ? 'dolore e nota' : 'nota'

  return (
    <div className="rx-card rounded-[4px] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap" style={{ opacity: row.valid ? 1 : 0.5 }}>
        <span className="font-display text-[11px] font-bold tracking-[1px] text-white">
          {position} · {sideLabel.upper}
          {repeatOfPosition ? <span className="font-body font-normal tracking-normal" style={{ color: 'var(--rx-text-muted)' }}> · ripetizione della prova {repeatOfPosition}</span> : null}
        </span>
        <div className="flex items-center gap-2">
          {isCeiling && <Badge color="var(--rx-accent)">TETTO {spec.ceiling} S</Badge>}
          {isBest && <Badge color="var(--rx-accent)">MIGLIORE</Badge>}
          {canRemove && (
            <button
              type="button" onClick={() => onRemove(row.key)}
              className="font-display text-[10px] tracking-[1px] bg-transparent border-none cursor-pointer p-1"
              style={{ color: 'var(--rx-text-muted)' }}
              aria-label={`Rimuovi la prova ${position}`}
            >
              RIMUOVI
            </button>
          )}
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <div className="flex-1 min-w-0" style={{ opacity: row.valid ? 1 : 0.5 }}>
          <Input
            id={fieldId(field('nativeValue'))}
            data-trial-value={row.key}
            aria-label={`Prova ${position}, ${test.limbName} ${sideLabel.label}, valore in ${unit}`}
            aria-invalid={Boolean(valueError)}
            type="text" inputMode="decimal" enterKeyHint="next"
            placeholder={row.valid ? unit : `${unit} (facoltativo)`}
            value={row.nativeValue}
            onChange={e => onChange(row.key, { nativeValue: e.target.value })}
            onKeyDown={e => onValueKeyDown(e, row.key)}
            style={{ minHeight: 44 }}
          />
        </div>
        <div className="flex gap-1 shrink-0" role="group" aria-label={`Esito della prova ${position}`}>
          <SegmentedToggle id={fieldId(field('valid'))} active={row.valid} onClick={() => onToggleValid(row.key, true)} className="text-[10px] px-2.5 rounded-[3px]">VALIDA</SegmentedToggle>
          <SegmentedToggle
            active={!row.valid} color="var(--rx-warning)" disabled={!canMarkInvalid}
            onClick={() => onToggleValid(row.key, false)}
            className="text-[10px] px-2.5 rounded-[3px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            NON VALIDA
          </SegmentedToggle>
        </div>
      </div>
      {unit === 'kgf' && hasValue && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          {formatNumber(value, NATIVE_DECIMALS)} kgf = {formatNumber(value * spec.unitFactors.kgf)} N
        </span>
      )}
      {valueError && <p role="alert" className="m-0 text-red-400 font-body text-[12px]">{valueError}</p>}

      {test.endReasonOptions && (
        <Field label={row.valid ? 'Motivo di fine' : 'Motivo di fine (facoltativo)'} htmlFor={fieldId(field('endReason'))} error={errorOf('endReason')}>
          <select
            id={fieldId(field('endReason'))} className="input-base"
            value={row.endReason} onChange={e => onChange(row.key, { endReason: e.target.value })}
          >
            <option value="">Seleziona…</option>
            {test.endReasonOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
      )}

      {!row.valid && (
        <Field label="Motivo" htmlFor={fieldId(field('invalidReason'))} error={errorOf('invalidReason')}>
          <select
            id={fieldId(field('invalidReason'))} className="input-base"
            value={row.invalidReason} onChange={e => onChange(row.key, { invalidReason: e.target.value })}
          >
            <option value="">Seleziona…</option>
            {test.invalidReasonOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
      )}
      {showCapNotice && (
        <p className="m-0 font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          Già {spec.maxInvalidPerSide} prove non valide per la {test.limbName} {sideLabel.label}: non se ne possono aggiungere, usa Stop anticipato.
        </p>
      )}

      <button
        type="button" onClick={() => onToggleExtras(row.key)} aria-expanded={isExtrasOpen}
        className="self-start font-body text-[12px] bg-transparent border-none cursor-pointer p-0"
        style={{ color: 'var(--rx-text-muted)' }}
      >
        {isExtrasOpen ? `− ${extrasName}` : `+ ${extrasName}${row.pain || row.note ? ' (compilati)' : ''}`}
      </button>
      {isExtrasOpen && (
        <div className={hasTrialPain ? 'grid grid-cols-[90px_1fr] gap-2' : 'flex flex-col gap-2'}>
          {hasTrialPain && (
            <Field label="Dolore" htmlFor={fieldId(field('pain'))} error={errorOf('pain')}>
              <Input
                id={fieldId(field('pain'))} type="number" inputMode="numeric" step="1" min="0" max="10" placeholder="0–10"
                value={row.pain} onChange={e => onChange(row.key, { pain: e.target.value })}
                className="input-compact text-center"
              />
            </Field>
          )}
          <Field label={row.invalidReason === 'other' && !row.valid ? 'Nota (motivo)' : 'Nota'} htmlFor={fieldId(field('note'))} error={errorOf('note')}>
            <Input
              id={fieldId(field('note'))} maxLength={TEXT_LIMITS.trialNote}
              value={row.note} onChange={e => onChange(row.key, { note: e.target.value })}
              className="input-compact"
            />
          </Field>
        </div>
      )}
    </div>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

/** "D 245 N · S 2/3 valide": best del lato completo, altrimenti il conteggio */
function formatBilateralSides(preview, spec, testId) {
  const decimals = BILATERAL_TESTS[testId]?.displayDecimals ?? 0
  return spec.sides.map(side => (
    preview.bestBySide[side] !== null
      ? `${SIDE_LABELS[side].short} ${formatNumber(preview.bestBySide[side], decimals)} ${spec.canonicalUnit}`
      : `${SIDE_LABELS[side].short} ${preview.validCountBySide[side]}/${spec.validTrialsPerSide} valide`
  )).join(' · ')
}
