import { Button, Field, Input, Textarea, SectionLabel, SegmentedToggle, WarningNote } from '../../components/ui'
import { TEXT_LIMITS } from '../../utils/lipedema'
import { fieldId } from './formModelUtils'

const STEPPER_MIN_HEIGHT = 44   // area di tocco minima

/**
 * Campi comuni ai form delle valutazioni. Ricevono valori, errori visibili e
 * setter da useAssessmentForm: nessuno stato proprio, salvo l'apertura delle
 * sezioni facoltative (gestita dal form, che la apre sul primo errore).
 */

/** Sì/No a due pillole. `disabled` + `help` per una scelta imposta da un altro campo */
export function YesNoField({ label, id, value, onChange, error, disabled = false, help }) {
  const helpId = help ? `${id}-help` : undefined
  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={helpId}>
      <div id={`${id}-label`} className="text-white/40 text-[11px] font-display tracking-[3px] mb-1.5">{label.toUpperCase()}</div>
      <div className="flex gap-2">
        <SegmentedToggle id={id} active={value === false} disabled={disabled} onClick={() => onChange(false)} className="flex-1 text-[12px] px-4 py-2.5 rounded-[3px] disabled:cursor-not-allowed disabled:opacity-50">NO</SegmentedToggle>
        <SegmentedToggle active={value === true} disabled={disabled} onClick={() => onChange(true)} className="flex-1 text-[12px] px-4 py-2.5 rounded-[3px] disabled:cursor-not-allowed disabled:opacity-50">SÌ</SegmentedToggle>
      </div>
      {help && <p id={helpId} className="m-0 mt-1 font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{help}</p>}
      {error && <p role="alert" className="m-0 mt-1 text-red-400 font-body text-[12px]">{error}</p>}
    </div>
  )
}

/** Scelta esclusiva tra più opzioni ({ value, label }), stessa resa di YesNoField */
export function ChoiceField({ label, id, options, value, onChange, error }) {
  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      <div id={`${id}-label`} className="text-white/40 text-[11px] font-display tracking-[3px] mb-1.5">{label.toUpperCase()}</div>
      <div className="flex gap-2">
        {options.map((option, index) => (
          <SegmentedToggle
            key={option.value}
            id={index === 0 ? id : undefined}
            active={value === option.value}
            onClick={() => onChange(option.value)}
            className="flex-1 text-[12px] px-3 py-2.5 rounded-[3px]"
          >
            {option.label}
          </SegmentedToggle>
        ))}
      </div>
      {error && <p role="alert" className="m-0 mt-1 text-red-400 font-body text-[12px]">{error}</p>}
    </div>
  )
}

export function ReadonlyValue({ label, value }) {
  return (
    <div>
      <div className="text-white/40 text-[11px] font-display tracking-[3px] mb-1.5">{label.toUpperCase()}</div>
      <div className="font-body text-[13px] text-white/80 py-2">{value}</div>
    </div>
  )
}

/** Variante (percorso, sedia): avviso ambra + conferma obbligatoria */
export function VariantConfirm({ field, message, confirmLabel, checked, onChange, error }) {
  return (
    <WarningNote title="Variante">
      {message}
      <label htmlFor={fieldId(field)} className="flex items-center gap-2 mt-2 cursor-pointer text-white/80">
        <input
          id={fieldId(field)} type="checkbox"
          checked={checked} onChange={onChange}
          aria-invalid={Boolean(error)}
          style={{ accentColor: 'var(--rx-warning)', width: 18, height: 18 }}
        />
        {confirmLabel}
      </label>
      {error && <p role="alert" className="m-0 mt-1 text-red-400 font-body text-[12px]">{error}</p>}
    </WarningNote>
  )
}

/**
 * Motivo dell'interruzione dal catalogo del test + descrizione (obbligatoria
 * con "Altro"). `timeField` (facoltativo): il tempo raggiunto, accanto al motivo.
 */
export function StopReasonFields({ options, code, note, onChangeCode, onChangeNote, errors, timeField }) {
  const reasonField = (
    <Field label="Motivo dell'interruzione" htmlFor={fieldId('clinical.stopReasonCode')} error={errors['clinical.stopReasonCode']}>
      <select id={fieldId('clinical.stopReasonCode')} className="input-base" value={code} onChange={onChangeCode}>
        <option value="">Seleziona…</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  )
  return (
    <>
      {timeField ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{timeField}{reasonField}</div> : reasonField}
      <Field
        label={code === 'other' ? 'Descrizione del motivo' : 'Descrizione del motivo (facoltativa)'}
        htmlFor={fieldId('clinical.stopReasonNote')} error={errors['clinical.stopReasonNote']}
      >
        <Textarea
          id={fieldId('clinical.stopReasonNote')} maxLength={TEXT_LIMITS.stopReasonNote}
          value={note} onChange={onChangeNote}
        />
      </Field>
    </>
  )
}

/** Numero e durata totale delle pause: il cronometro ufficiale non si ferma */
export function PauseFields({ form, errors, setField }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Pause" htmlFor={fieldId('events.pauseCount')} error={errors['events.pauseCount']}>
          <Input
            id={fieldId('events.pauseCount')} type="number" inputMode="numeric" step="1" min="0"
            value={form.pauseCount} onChange={setField('pauseCount')}
          />
        </Field>
        {Number(form.pauseCount) > 0 && (
          <Field label="Durata totale pause (s)" htmlFor={fieldId('events.pauseDurationS')} error={errors['events.pauseDurationS']}>
            <Input
              id={fieldId('events.pauseDurationS')} type="number" inputMode="numeric" step="1" min="1"
              value={form.pauseDurationS} onChange={setField('pauseDurationS')}
            />
          </Field>
        )}
      </div>
      <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
        Il cronometro ufficiale non si ferma durante le pause.
      </p>
    </>
  )
}

/**
 * Parametri clinici facoltativi, collassati: righe PRE | POST del test (anche
 * nessuna) + condizioni concomitanti. Nessun colore o giudizio sui valori.
 */
export function ClinicalSection({ rows, form, errors, isOpen, onToggle, filledCount, setClinical, setField }) {
  return (
    <section className="rx-card rounded-[4px] p-5 flex flex-col gap-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="assessment-clinical"
        className="flex items-center justify-between gap-3 bg-transparent border-none p-0 cursor-pointer text-left"
      >
        <span className="font-display text-[11px] font-semibold tracking-[3px] uppercase" style={{ color: 'var(--rx-accent)' }}>
          ◈ Parametri clinici (facoltativi)
        </span>
        <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
          {filledCount > 0 ? `${filledCount} compilat${filledCount === 1 ? 'o' : 'i'}` : 'Nessuno'} · {isOpen ? 'chiudi' : 'apri'}
        </span>
      </button>

      {isOpen && (
        <div id="assessment-clinical" className="flex flex-col gap-4">
          {rows.length > 0 && (
            <div className="grid grid-cols-[1fr_90px_90px] gap-x-3 gap-y-2 items-center">
              <span />
              <span className="font-display text-[10px] tracking-[2px] text-center" style={{ color: 'var(--rx-text-muted)' }}>PRE</span>
              <span className="font-display text-[10px] tracking-[2px] text-center" style={{ color: 'var(--rx-text-muted)' }}>POST</span>
              {rows.map(row => (
                <ClinicalRow key={row.pre} row={row} form={form} errors={errors} onChange={setClinical} />
              ))}
            </div>
          )}
          <Field label="Condizioni concomitanti" htmlFor={fieldId('clinical.conditionsNote')} error={errors['clinical.conditionsNote']}>
            <Textarea
              id={fieldId('clinical.conditionsNote')} maxLength={TEXT_LIMITS.conditionsNote}
              placeholder="Es. lipo-linfedema, patologie muscoloscheletriche o cardiopolmonari"
              value={form.conditionsNote} onChange={setField('conditionsNote')}
            />
          </Field>
        </div>
      )}
    </section>
  )
}

/**
 * Deviazione dal protocollo + note. `deviationLock` (testo): la deviazione è
 * imposta da un altro campo (es. sedia con braccioli) e non si può togliere.
 */
export function ClosingSection({ form, errors, setField, setValue, deviationLock }) {
  return (
    <section className="rx-card rounded-[4px] p-5 flex flex-col gap-4">
      <SectionLabel>◈ Chiusura</SectionLabel>
      <YesNoField
        label="Deviazione dal protocollo"
        id={fieldId('deviation.present')}
        value={form.deviationPresent}
        onChange={value => setValue('deviationPresent', value)}
        error={errors['deviation.present']}
        disabled={Boolean(deviationLock)}
        help={deviationLock}
      />
      {form.deviationPresent && (
        <Field label="Descrizione della deviazione" htmlFor={fieldId('deviation.note')} error={errors['deviation.note']}>
          <Textarea
            id={fieldId('deviation.note')} maxLength={TEXT_LIMITS.deviationNote}
            value={form.deviationNote} onChange={setField('deviationNote')}
          />
        </Field>
      )}
      <Field label={`Note (facoltative, max ${TEXT_LIMITS.notes})`} htmlFor={fieldId('notes')} error={errors.notes}>
        <Textarea id={fieldId('notes')} maxLength={TEXT_LIMITS.notes} value={form.notes} onChange={setField('notes')} />
      </Field>
    </section>
  )
}

/** Contatore intero con − / + da 44 px (tratti 2MWT, alzate 30s-STS) */
export function StepperInput({ id, value, onChange, onStep, decreaseLabel, increaseLabel, describedBy }) {
  return (
    <div className="flex items-center gap-2">
      <StepButton label={decreaseLabel} onClick={() => onStep(-1)}>−</StepButton>
      <Input
        id={id} type="number" inputMode="numeric" step="1" min="0"
        value={value} onChange={onChange}
        aria-describedby={describedBy}
        className="text-center"
        style={{ minHeight: STEPPER_MIN_HEIGHT }}
      />
      <StepButton label={increaseLabel} onClick={() => onStep(1)}>+</StepButton>
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function StepButton({ label, onClick, children }) {
  return (
    <Button
      type="button" size="sm" variant="ghost" aria-label={label} onClick={onClick}
      className="min-w-[44px] min-h-[44px] !px-0 text-[18px]"
    >
      {children}
    </Button>
  )
}

function ClinicalRow({ row, form, errors, onChange }) {
  const error = errors[`clinical.${row.pre}`] ?? errors[`clinical.${row.post}`]
  return (
    <>
      <span className="font-body text-[12px] text-white/70">{row.label}</span>
      {[row.pre, row.post].map(key => (
        <Input
          key={key}
          id={fieldId(`clinical.${key}`)}
          aria-label={`${row.label} ${key === row.pre ? 'pre' : 'post'}`}
          aria-invalid={Boolean(errors[`clinical.${key}`])}
          type="number" inputMode="decimal" step={row.step}
          value={form.clinical[key]} onChange={onChange(key)}
          className="text-center input-compact"
        />
      ))}
      {error && <p role="alert" className="col-span-3 m-0 -mt-1 text-red-400 font-body text-[12px]">{error}</p>}
    </>
  )
}
