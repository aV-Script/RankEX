// Stato del form Handgrip (stringhe, come arrivano dagli input) ↔ input della
// callable. Le prove sono righe in ordine cronologico: 6 pianificate D-S-D-S-D-S,
// più le ripetizioni delle non valide in coda (ADR-016 §3). Best, simmetria e
// conteggio delle valide li calcola solo computeBilateralResult (CORE).
import { LIPEDEMA_TEST_IDS, HANDGRIP, normalizeKey } from '../../utils/lipedema'
import { toNumber, toText } from './formModelUtils'

const TRIAL_FIELDS = ['nativeValue', 'valid', 'invalidReason', 'note', 'pain', 'seq', 'side']

/**
 * Lato proposto per la prossima prova: quello con meno prove valide; a parità
 * l'opposto dell'ultima, e si parte dal primo lato della specifica (destra).
 */
export function proposeNextSide(trials, spec = HANDGRIP) {
  const validCount = side => trials.filter(trial => trial.side === side && trial.valid).length
  const lastSide   = trials.at(-1)?.side ?? null
  return [...spec.sides].sort((a, b) => {
    const byCount = validCount(a) - validCount(b)
    if (byCount !== 0) return byCount
    if (lastSide === null) return spec.sides.indexOf(a) - spec.sides.indexOf(b)
    return (a === lastSide ? 1 : 0) - (b === lastSide ? 1 : 0)
  })[0]
}

/** Riga di prova vuota */
export function createTrialRow(key, side, repeatOf = null) {
  return { key, side, valid: true, nativeValue: '', invalidReason: '', note: '', pain: '', repeatOf }
}

/** 6 prove pianificate a lati alternati, guidate da proposeNextSide */
export function createPlannedTrials(spec = HANDGRIP) {
  const trials = []
  const total  = spec.sides.length * spec.validTrialsPerSide
  for (let i = 0; i < total; i += 1) trials.push(createTrialRow(i + 1, proposeNextSide(trials, spec)))
  return trials
}

/** Una riga senza nessun dato inserito */
export function isEmptyTrialRow(row) {
  return row.nativeValue.trim() === '' && row.note.trim() === '' && row.pain.trim() === '' && row.valid
}

export function nextTrialKey(trials) {
  return trials.reduce((max, trial) => Math.max(max, trial.key), 0) + 1
}

/**
 * Righe che diventano prove salvate, con il loro indice nell'input (gli errori
 * del CORE sono `trials.{indice}.*`). Con lo stop anticipato le righe pianificate
 * rimaste vuote sono prove non eseguite: non si salvano.
 */
export function getSubmittedTrialRows(form) {
  const rows = form.stoppedEarly ? form.trials.filter(row => !isEmptyTrialRow(row)) : form.trials
  return rows.map((row, inputIndex) => ({ row, inputIndex }))
}

/**
 * Form nuovo. Dinamometro, impugnatura, lato dominante e unità dall'ultima
 * Handgrip valida (ADR-016 §5): nessuna lettura né persistenza in più.
 * @param {string}      nowLocal — 'YYYY-MM-DDTHH:mm'
 * @param {object|null} previous — ultima Handgrip valida del paziente
 */
export function createHandgripForm(nowLocal, previous = null) {
  const setup = previous?.setup ?? {}
  return {
    performedAt:    nowLocal,
    deviceBrand:    setup.device?.brand ?? '',
    deviceModel:    setup.device?.model ?? '',
    deviceSerial:   setup.device?.serial ?? '',
    gripSetting:    setup.gripSetting ?? '',
    dominantSide:   setup.dominantSide ?? '',
    nativeUnit:     setup.nativeUnit ?? HANDGRIP.canonicalUnit,
    trials:         createPlannedTrials(),
    stoppedEarly:   false,
    stopReasonCode: '',
    stopReasonNote: '',
    clinical:       {},
    conditionsNote: '',
    deviationPresent: false,
    deviationNote:  '',
    notes:          '',
  }
}

/** Form precompilato da una valutazione salvata (Correggi): le prove così come sono */
export function handgripFormFromAssessment(assessment) {
  const { setup = {}, trials = [], events = {}, clinical = {}, deviation = {} } = assessment
  return {
    performedAt:    assessment.performedAt,
    deviceBrand:    setup.device?.brand ?? '',
    deviceModel:    setup.device?.model ?? '',
    deviceSerial:   setup.device?.serial ?? '',
    gripSetting:    setup.gripSetting ?? '',
    dominantSide:   setup.dominantSide ?? '',
    nativeUnit:     setup.nativeUnit ?? HANDGRIP.canonicalUnit,
    trials:         trials.map((trial, index) => ({
      key:           index + 1,
      side:          trial.side,
      valid:         trial.valid === true,
      nativeValue:   toText(trial.nativeValue),
      invalidReason: trial.invalidReason ?? '',
      note:          trial.note ?? '',
      pain:          toText(trial.pain),
      repeatOf:      null,
    })),
    stoppedEarly:   events.stoppedEarly === true,
    stopReasonCode: clinical.stopReasonCode ?? '',
    stopReasonNote: clinical.stopReasonNote ?? '',
    clinical:       {},
    conditionsNote: clinical.conditionsNote ?? '',
    deviationPresent: deviation.present === true,
    deviationNote:  deviation.note ?? '',
    notes:          assessment.notes ?? '',
  }
}

/** Input della callable: il client non manda mai value/result (li calcola il server) */
export function buildHandgripInput(form) {
  return {
    testId:      LIPEDEMA_TEST_IDS.HANDGRIP,
    performedAt: form.performedAt,
    setup: {
      dominantSide: form.dominantSide || null,
      device:       { brand: form.deviceBrand, model: form.deviceModel, serial: form.deviceSerial },
      gripSetting:  form.gripSetting,
      nativeUnit:   form.nativeUnit,
    },
    trials: getSubmittedTrialRows(form).map(({ row, inputIndex }) => ({
      seq:           inputIndex + 1,
      side:          row.side,
      valid:         row.valid,
      invalidReason: row.valid ? null : (row.invalidReason || null),
      nativeValue:   toNumber(row.nativeValue),
      pain:          toNumber(row.pain),
      note:          row.note,
    })),
    events: { stoppedEarly: form.stoppedEarly },
    clinical: {
      stopReasonCode: form.stoppedEarly ? (form.stopReasonCode || null) : null,
      stopReasonNote: form.stoppedEarly ? form.stopReasonNote : null,
      conditionsNote: form.conditionsNote,
    },
    deviation: {
      present: form.deviationPresent,
      note:    form.deviationPresent ? form.deviationNote : null,
    },
    notes: form.notes,
  }
}

/** Ordine dei campi a schermo, prove comprese (focus sul primo errore) */
export function getHandgripFieldOrder(form) {
  const trialFields = getSubmittedTrialRows(form)
    .flatMap(({ inputIndex }) => TRIAL_FIELDS.map(name => `trials.${inputIndex}.${name}`))
  return [
    'performedAt',
    'setup.device.brand', 'setup.device.model', 'setup.device.serial', 'setup.gripSetting',
    'setup.dominantSide', 'setup.nativeUnit',
    ...trialFields, 'trials',
    'events.stoppedEarly', 'clinical.stopReasonCode', 'clinical.stopReasonNote',
    'clinical.conditionsNote', 'deviation.present', 'deviation.note', 'notes',
  ]
}

/**
 * Prove per l'anteprima (stessa forma di quelle normalizzate dal CORE): value
 * canonico solo per i numeri positivi, così computeBilateralResult mostra il
 * risultato mentre si compila.
 */
export function toPreviewTrials(input, spec = HANDGRIP) {
  const factor = spec.unitFactors[input.setup.nativeUnit] ?? null
  return input.trials.map(trial => ({
    side:  trial.side,
    valid: trial.valid,
    value: factor !== null && Number.isFinite(trial.nativeValue) && trial.nativeValue > 0 ? trial.nativeValue * factor : null,
  }))
}

/** Chiave di confronto del dinamometro (normalizeKey del CORE, come il server) */
export function deviceModelKeyOf(brand, model) {
  return `${normalizeKey(brand)}|${normalizeKey(model)}`
}

export function gripSettingKeyOf(gripSetting) {
  return normalizeKey(gripSetting)
}
