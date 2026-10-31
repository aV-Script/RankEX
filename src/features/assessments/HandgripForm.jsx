import { useState, useMemo, useCallback } from 'react'
import { Badge, Button, Field, Input, SectionLabel, SegmentedToggle, WarningNote } from '../../components/ui'
import { computeBilateralResult, HANDGRIP, LIPEDEMA_TEST_IDS, TEXT_LIMITS, BILATERAL_SIDE_STATUS } from '../../utils/lipedema'
import {
  buildHandgripInput, getHandgripFieldOrder, getSubmittedTrialRows, toPreviewTrials, createTrialRow, nextTrialKey,
  isEmptyTrialRow, deviceModelKeyOf, gripSettingKeyOf, proposeNextSide,
} from './handgripFormModel'
import { fieldId } from './formModelUtils'
import { useAssessmentForm }   from './useAssessmentForm'
import { AssessmentFormShell } from './AssessmentFormShell'
import {
  YesNoField, ChoiceField, ReadonlyValue, StopReasonFields, ClinicalSection, ClosingSection,
} from './AssessmentFormFields'
import { formatNumber, formatShortDate } from './assessmentFormat'
import { LIPEDEMA_TESTS, SIDE_LABELS, DOMINANT_SIDE_OPTIONS } from '../../config/lipedemaTests.config'

const TEST = LIPEDEMA_TESTS[LIPEDEMA_TEST_IDS.HANDGRIP]
const UNIT_OPTIONS = Object.keys(HANDGRIP.unitFactors).map(unit => ({ value: unit, label: unit }))
const KGF_FACTOR_TEXT = String(HANDGRIP.unitFactors.kgf).replace('.', ',')
const NATIVE_DECIMALS = 1   // kgf letto mostrato con 1 decimale (ADR-016 §4)
const SYMMETRY_DECIMALS = 1
const MAX_TRIALS = HANDGRIP.sides.length * (HANDGRIP.validTrialsPerSide + HANDGRIP.maxInvalidPerSide)

/**
 * Nuova valutazione Handgrip a schermo intero (ADR-016). Prove in ordine
 * cronologico, 6 pianificate D-S alternate; una prova non valida resta salvata
 * e accoda la sua ripetizione (al massimo `maxInvalidPerSide` per mano, poi
 * serve lo stop). Best, più forte e simmetria vengono dalla logica bilaterale
 * del CORE, la stessa che il server usa per salvarli. Dolore per prova,
 * facoltativo: il massimo per mano lo deriva il server.
 * @param {object|null} props.previous — ultima Handgrip valida (precompilazione + avviso dinamometro)
 */
export function HandgripForm({ client, examinerName, initialForm, supersedes, previous, onSave, onBack, onPrivacyNoticeMissing, onDirtyChange }) {
  const [isClinicalOpen,   setIsClinicalOpen]   = useState(() => initialForm.conditionsNote.trim() !== '')
  const [openExtras,       setOpenExtras]       = useState(() => new Set(initialForm.trials.filter(row => row.pain || row.note).map(row => row.key)))
  const [hasUnitWarning,   setHasUnitWarning]   = useState(false)

  // Apre la riga o la sezione che contiene il primo errore, prima del focus
  const handleRevealField = useCallback((field, currentForm) => {
    if (field === 'clinical.conditionsNote') setIsClinicalOpen(true)
    const match = /^trials\.(\d+)\.(pain|note)$/.exec(field)
    if (!match) return
    const submitted = getSubmittedTrialRows(currentForm)[Number(match[1])]
    if (submitted) setOpenExtras(prev => new Set(prev).add(submitted.row.key))
  }, [])

  const formState = useAssessmentForm({
    initialForm, buildInput: buildHandgripInput, getFieldOrder: getHandgripFieldOrder,
    onRevealField: handleRevealField, birthDate: client.dataNascita ?? null, supersedes,
    onSave, onBack, onPrivacyNoticeMissing, onDirtyChange,
  })
  const { form, setForm, setField, setValue, setClinical, input, visibleErrors, nowLocal } = formState

  const preview     = useMemo(() => computeBilateralResult(toPreviewTrials(input), HANDGRIP), [input])
  const inputIndexByKey = useMemo(
    () => new Map(getSubmittedTrialRows(form).map(({ row, inputIndex }) => [row.key, inputIndex])),
    [form],
  )
  const bestKeyBySide = useMemo(() => findBestKeys(form.trials, input, preview, inputIndexByKey), [form.trials, input, preview, inputIndexByKey])

  const isKgf = form.nativeUnit === 'kgf'
  const hasPreviousSetup = Boolean(previous) && !supersedes
  const isDeviceChanged  = hasPreviousSetup && form.deviceBrand.trim() !== '' && form.deviceModel.trim() !== '' && (
    deviceModelKeyOf(form.deviceBrand, form.deviceModel) !== previous.comparability?.deviceModelKey ||
    gripSettingKeyOf(form.gripSetting) !== previous.comparability?.gripSettingKey
  )

  // Cambiare unità non converte i valori già scritti: si avvisa di ricontrollarli
  const handleUnitChange = useCallback((unit) => {
    if (unit !== form.nativeUnit && form.trials.some(row => row.nativeValue.trim() !== '')) setHasUnitWarning(true)
    setValue('nativeUnit', unit)
  }, [form.nativeUnit, form.trials, setValue])

  const updateRow = useCallback((key, patch) => {
    setForm(prev => ({ ...prev, trials: prev.trials.map(row => (row.key === key ? { ...row, ...patch } : row)) }))
  }, [setForm])

  // Non valida → si accoda la ripetizione della stessa mano (una sola per
  // prova, finché ammessa); di nuovo valida → la ripetizione ancora vuota sparisce
  const handleToggleValid = useCallback((key, valid) => {
    setForm(prev => {
      const target = prev.trials.find(row => row.key === key)
      if (!target || target.valid === valid) return prev
      let trials = prev.trials.map(row => (row.key === key ? { ...row, valid, invalidReason: valid ? '' : row.invalidReason } : row))
      if (!valid) {
        const invalidCount = trials.filter(row => row.side === target.side && !row.valid).length
        const hasRepeat    = trials.some(row => row.repeatOf === key)
        if (invalidCount <= HANDGRIP.maxInvalidPerSide && !hasRepeat) {
          trials = [...trials, createTrialRow(nextTrialKey(trials), target.side, key)]
        }
      } else {
        const repeat = trials.find(row => row.repeatOf === key)
        if (repeat && isEmptyTrialRow(repeat)) trials = trials.filter(row => row.key !== repeat.key)
      }
      return { ...prev, trials }
    })
  }, [setForm])

  const handleRemoveRow = useCallback((key) => {
    setForm(prev => ({ ...prev, trials: prev.trials.filter(row => row.key !== key) }))
  }, [setForm])

  // Correzione: prove aggiunte sul lato proposto (meno valide, poi alternanza)
  const handleAddRow = useCallback(() => {
    setForm(prev => (prev.trials.length >= MAX_TRIALS ? prev : {
      ...prev, trials: [...prev.trials, createTrialRow(nextTrialKey(prev.trials), proposeNextSide(prev.trials))],
    }))
  }, [setForm])

  const handleToggleExtras = useCallback((key) => {
    setOpenExtras(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Invio sul valore → prova successiva (inserimento rapido delle 6 prove)
  const handleValueKeyDown = useCallback((event, key) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const index = form.trials.findIndex(row => row.key === key)
    const next  = form.trials[index + 1]
    if (!next) return
    const element = document.querySelector(`[data-trial-value="${next.key}"]`)
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    element?.focus({ preventScroll: true })
  }, [form.trials])

  const incompleteSides = HANDGRIP.sides.filter(side => preview.sideStatus[side] !== BILATERAL_SIDE_STATUS.COMPLETE)
  const cappedSides     = HANDGRIP.sides.filter(side => isInvalidCapReached(form.trials, side))
  // L'invito allo stop compare una volta per mano, sulla prima riga valida
  const capNoticeKeys   = new Set(cappedSides.map(side => form.trials.find(row => row.side === side && row.valid)?.key))

  return (
    <AssessmentFormShell
      test={TEST}
      client={client}
      supersedes={supersedes}
      formState={formState}
      onBack={onBack}
      summary={<ResultSummary preview={preview} trials={form.trials} input={input} bestKeyBySide={bestKeyBySide} inputIndexByKey={inputIndexByKey} isKgf={isKgf} />}
      confirmSummary={(
        <>
          <span className="font-display font-black text-[20px] text-white">{formatSides(preview)}</span>
          <span>{form.stoppedEarly ? 'Interrotta' : `Completa · ${HANDGRIP.validTrialsPerSide} prove valide per mano`} · unità {form.nativeUnit}</span>
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

        {hasPreviousSetup && (
          <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            Dinamometro, impugnatura, mano dominante e unità precompilati dalla valutazione del {formatShortDate(previous.performedAt)}.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Marca dinamometro" htmlFor={fieldId('setup.device.brand')} error={visibleErrors['setup.device.brand']}>
            <Input id={fieldId('setup.device.brand')} maxLength={TEXT_LIMITS.deviceField} value={form.deviceBrand} onChange={setField('deviceBrand')} />
          </Field>
          <Field label="Modello" htmlFor={fieldId('setup.device.model')} error={visibleErrors['setup.device.model']}>
            <Input id={fieldId('setup.device.model')} maxLength={TEXT_LIMITS.deviceField} value={form.deviceModel} onChange={setField('deviceModel')} />
          </Field>
          <Field label="Seriale (facoltativo)" htmlFor={fieldId('setup.device.serial')} error={visibleErrors['setup.device.serial']}>
            <Input id={fieldId('setup.device.serial')} maxLength={TEXT_LIMITS.deviceField} value={form.deviceSerial} onChange={setField('deviceSerial')} />
          </Field>
        </div>

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

        <div className="flex flex-col gap-1">
          <ChoiceField
            label="Unità di inserimento" id={fieldId('setup.nativeUnit')}
            options={UNIT_OPTIONS} value={form.nativeUnit}
            onChange={handleUnitChange} error={visibleErrors['setup.nativeUnit']}
          />
          <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            Salvato in N (1 kgf = {KGF_FACTOR_TEXT} N); il valore letto sullo strumento resta conservato.
          </p>
        </div>
        {hasUnitWarning && (
          <WarningNote title="Unità">Verifica i valori: sono interpretati in {form.nativeUnit}.</WarningNote>
        )}
      </section>

      {/* B. Prove */}
      <section id={fieldId('trials')} tabIndex={-1} className="rx-card rounded-[4px] p-5 flex flex-col gap-3 outline-none">
        <SectionLabel>◈ Prove</SectionLabel>
        <p className="font-body text-[12px] m-0 -mt-2" style={{ color: 'var(--rx-text-muted)' }}>
          Destra e sinistra alternate, circa 60 s di recupero prima di ritestare la stessa mano. Contrazione massimale di circa 3 s.
        </p>

        <ul className="flex flex-col gap-2 list-none m-0 p-0">
          {form.trials.map((row, index) => (
            <li key={row.key}>
              <TrialRow
                row={row}
                position={index + 1}
                repeatOfPosition={row.repeatOf ? form.trials.findIndex(item => item.key === row.repeatOf) + 1 : null}
                inputIndex={inputIndexByKey.get(row.key) ?? null}
                unit={form.nativeUnit}
                isBest={bestKeyBySide[row.side] === row.key}
                isExtrasOpen={openExtras.has(row.key)}
                canMarkInvalid={!row.valid || !cappedSides.includes(row.side)}
                showCapNotice={capNoticeKeys.has(row.key)}
                canRemove={Boolean(supersedes) || Boolean(row.repeatOf) || (cappedSides.includes(row.side) && isEmptyTrialRow(row))}
                errors={visibleErrors}
                onChange={updateRow}
                onToggleValid={handleToggleValid}
                onToggleExtras={handleToggleExtras}
                onRemove={handleRemoveRow}
                onValueKeyDown={handleValueKeyDown}
              />
            </li>
          ))}
        </ul>

        {supersedes && (
          <Button size="sm" variant="ghost" className="self-start" onClick={handleAddRow} disabled={form.trials.length >= MAX_TRIALS}>
            + AGGIUNGI PROVA
          </Button>
        )}

        {!form.stoppedEarly && incompleteSides.map(side => (
          <p key={side} className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            {preview.validCountBySide[side] > HANDGRIP.validTrialsPerSide
              ? `Troppe prove valide per la mano ${SIDE_LABELS[side].label} (${preview.validCountBySide[side]} su ${HANDGRIP.validTrialsPerSide}): segna come non valida o rimuovi quella in più.`
              : `Servono ${HANDGRIP.validTrialsPerSide} prove valide per la mano ${SIDE_LABELS[side].label} (${preview.validCountBySide[side]} di ${HANDGRIP.validTrialsPerSide}).`}
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
            ? `Una mano con meno di ${HANDGRIP.validTrialsPerSide} prove valide resta senza best; le prove senza valore non saranno salvate.`
            : `Per dolore, sintomi o controindicazione: consente meno di ${HANDGRIP.validTrialsPerSide} prove valide per mano.`}
        />
        {form.stoppedEarly && (
          <StopReasonFields
            options={TEST.stopReasonOptions}
            code={form.stopReasonCode} note={form.stopReasonNote}
            onChangeCode={setField('stopReasonCode')} onChangeNote={setField('stopReasonNote')}
            errors={visibleErrors}
          />
        )}
      </section>

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

// ── Componenti locali ─────────────────────────────────────────────────────────

function TrialRow({
  row, position, repeatOfPosition, inputIndex, unit, isBest, isExtrasOpen, canMarkInvalid, showCapNotice, canRemove, errors,
  onChange, onToggleValid, onToggleExtras, onRemove, onValueKeyDown,
}) {
  const field   = name => (inputIndex === null ? `trial-row-${row.key}.${name}` : `trials.${inputIndex}.${name}`)
  const errorOf = name => (inputIndex === null ? undefined : errors[`trials.${inputIndex}.${name}`])
  const value   = Number(String(row.nativeValue).replace(',', '.'))
  const hasValue = row.nativeValue.trim() !== '' && Number.isFinite(value) && value > 0
  const valueError = errorOf('nativeValue') ?? errorOf('valid') ?? errorOf('seq') ?? errorOf('side')
  const sideLabel = SIDE_LABELS[row.side]

  return (
    <div className="rx-card rounded-[4px] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap" style={{ opacity: row.valid ? 1 : 0.5 }}>
        <span className="font-display text-[11px] font-bold tracking-[1px] text-white">
          {position} · {sideLabel.upper}
          {repeatOfPosition ? <span className="font-body font-normal tracking-normal" style={{ color: 'var(--rx-text-muted)' }}> · ripetizione della prova {repeatOfPosition}</span> : null}
        </span>
        <div className="flex items-center gap-2">
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
            aria-label={`Prova ${position}, mano ${sideLabel.label}, valore in ${unit}`}
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
          {formatNumber(value, NATIVE_DECIMALS)} kgf = {formatNumber(value * HANDGRIP.unitFactors.kgf)} N
        </span>
      )}
      {valueError && <p role="alert" className="m-0 text-red-400 font-body text-[12px]">{valueError}</p>}

      {!row.valid && (
        <Field label="Motivo" htmlFor={fieldId(field('invalidReason'))} error={errorOf('invalidReason')}>
          <select
            id={fieldId(field('invalidReason'))} className="input-base"
            value={row.invalidReason} onChange={e => onChange(row.key, { invalidReason: e.target.value })}
          >
            <option value="">Seleziona…</option>
            {TEST.invalidReasonOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
      )}
      {showCapNotice && (
        <p className="m-0 font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          Già {HANDGRIP.maxInvalidPerSide} prove non valide per la mano {sideLabel.label}: non se ne possono aggiungere, usa Stop anticipato.
        </p>
      )}

      <button
        type="button" onClick={() => onToggleExtras(row.key)} aria-expanded={isExtrasOpen}
        className="self-start font-body text-[12px] bg-transparent border-none cursor-pointer p-0"
        style={{ color: 'var(--rx-text-muted)' }}
      >
        {isExtrasOpen ? '− dolore e nota' : `+ dolore e nota${row.pain || row.note ? ' (compilati)' : ''}`}
      </button>
      {isExtrasOpen && (
        <div className="grid grid-cols-[90px_1fr] gap-2">
          <Field label="Dolore" htmlFor={fieldId(field('pain'))} error={errorOf('pain')}>
            <Input
              id={fieldId(field('pain'))} type="number" inputMode="numeric" step="1" min="0" max="10" placeholder="0–10"
              value={row.pain} onChange={e => onChange(row.key, { pain: e.target.value })}
              className="input-compact text-center"
            />
          </Field>
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

function ResultSummary({ preview, trials, input, bestKeyBySide, inputIndexByKey, isKgf }) {
  const isComplete = preview.strongestValue !== null
  const nativeBest = side => {
    const index = inputIndexByKey.get(bestKeyBySide[side])
    return index === undefined ? null : input.trials[index]?.nativeValue ?? null
  }
  return (
    <div aria-live="polite" className="flex flex-col gap-0.5">
      <span className="font-display font-black text-[22px] text-white leading-tight">{formatSides(preview)}</span>
      {isComplete && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          Più forte: {preview.strongestSide ? SIDE_LABELS[preview.strongestSide].label : 'pari'} · Simmetria {formatNumber(preview.symmetryPct, SYMMETRY_DECIMALS)} %
        </span>
      )}
      {isKgf && HANDGRIP.sides.some(side => nativeBest(side) !== null) && (
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          Letti: {HANDGRIP.sides.filter(side => nativeBest(side) !== null).map(side => `${SIDE_LABELS[side].short} ${formatNumber(nativeBest(side), NATIVE_DECIMALS)} kgf`).join(' · ')}
        </span>
      )}
      <span className="sr-only">{trials.length} prove inserite</span>
    </div>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

/** "D 245 N · S 2/3 valide": best del lato completo, altrimenti il conteggio */
function formatSides(preview) {
  return HANDGRIP.sides.map(side => (
    preview.bestBySide[side] !== null
      ? `${SIDE_LABELS[side].short} ${formatNumber(preview.bestBySide[side])} ${HANDGRIP.canonicalUnit}`
      : `${SIDE_LABELS[side].short} ${preview.validCountBySide[side]}/${HANDGRIP.validTrialsPerSide} valide`
  )).join(' · ')
}

/** Riga che dà il best di ciascun lato completo (la prima, a pari valore) */
function findBestKeys(rows, input, preview, inputIndexByKey) {
  const previewTrials = toPreviewTrials(input)
  return Object.fromEntries(HANDGRIP.sides.map(side => {
    const best = preview.bestBySide[side]
    if (best === null) return [side, null]
    const row = rows.find(item => {
      const index = inputIndexByKey.get(item.key)
      const trial = index === undefined ? null : previewTrials[index]
      return trial && trial.side === side && trial.valid && trial.value === best
    })
    return [side, row?.key ?? null]
  }))
}

/** Mano con già il massimo di prove non valide: non se ne segnano altre, serve lo stop */
function isInvalidCapReached(trials, side) {
  return trials.filter(row => row.side === side && !row.valid).length >= HANDGRIP.maxInvalidPerSide
}
