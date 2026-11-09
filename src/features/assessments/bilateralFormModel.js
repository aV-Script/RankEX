// Stato dei form bilaterali (Handgrip, HHD, OLS): le prove sono righe in ordine
// cronologico, quelle pianificate a lati alternati, più le ripetizioni delle non
// valide in coda (ADR-016 §3). Best, simmetria e conteggio delle valide li calcola
// solo computeBilateralResult (CORE).
import { LIPEDEMA_TEST_IDS, byMostRecent } from '../../utils/lipedema'
import { toNumber, toText } from './formModelUtils'

const TRIAL_FIELDS = ['nativeValue', 'endReason', 'valid', 'invalidReason', 'note', 'pain', 'seq', 'side']

// Test dello stesso arto: la gamba dominante vale per entrambi (ADR-016 §5)
const LEG_TEST_IDS = [LIPEDEMA_TEST_IDS.HHD_QUADRICEPS, LIPEDEMA_TEST_IDS.ONE_LEG_STANDING]

/**
 * Gamba dominante dall'ultima valutazione valida di HHD o OLS, null se non c'è.
 * @param {object} latestByTest — getLatestValidByTest(...)
 */
export function getLatestDominantLeg(latestByTest = {}) {
  const [latest] = LEG_TEST_IDS.map(testId => latestByTest[testId]).filter(Boolean).sort(byMostRecent)
  return latest?.setup?.dominantSide ?? null
}

/**
 * Lato proposto per la prossima prova: quello con meno prove valide; a parità
 * l'opposto dell'ultima, e si parte dal primo lato della specifica (destra).
 */
export function proposeNextSide(trials, spec) {
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
  return { key, side, valid: true, nativeValue: '', endReason: '', invalidReason: '', note: '', pain: '', repeatOf }
}

/** Prove pianificate a lati alternati, guidate da proposeNextSide */
export function createPlannedTrials(spec) {
  const trials = []
  const total  = spec.sides.length * spec.validTrialsPerSide
  for (let i = 0; i < total; i += 1) trials.push(createTrialRow(i + 1, proposeNextSide(trials, spec)))
  return trials
}

/** Una riga senza nessun dato inserito */
export function isEmptyTrialRow(row) {
  return row.nativeValue.trim() === '' && !row.endReason && row.note.trim() === '' && row.pain.trim() === '' && row.valid
}

/** Prove con almeno un dato inserito: le righe pianificate ancora vuote non contano */
export function countFilledTrialRows(rows) {
  return rows.filter(row => !isEmptyTrialRow(row)).length
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

/** Righe da una valutazione salvata (Correggi): le prove così come sono */
export function trialRowsFromAssessment(trials = []) {
  return trials.map((trial, index) => ({
    key:           index + 1,
    side:          trial.side,
    valid:         trial.valid === true,
    nativeValue:   toText(trial.nativeValue),
    endReason:     trial.endReason ?? '',
    invalidReason: trial.invalidReason ?? '',
    note:          trial.note ?? '',
    pain:          toText(trial.pain),
    repeatOf:      null,
  }))
}

/**
 * Prove come input della callable: il client non manda mai value/result.
 * `getRowExtra` (facoltativa): campi per prova che solo un test ha.
 */
export function trialsToInput(form, getRowExtra) {
  return getSubmittedTrialRows(form).map(({ row, inputIndex }) => ({
    seq:           inputIndex + 1,
    side:          row.side,
    valid:         row.valid,
    invalidReason: row.valid ? null : (row.invalidReason || null),
    nativeValue:   toNumber(row.nativeValue),
    pain:          toNumber(row.pain),
    note:          row.note,
    ...getRowExtra?.(row),
  }))
}

/** Campi delle prove nell'ordine a schermo (focus sul primo errore) */
export function getTrialFieldOrder(form) {
  return getSubmittedTrialRows(form)
    .flatMap(({ inputIndex }) => TRIAL_FIELDS.map(name => `trials.${inputIndex}.${name}`))
}

/**
 * Prove per l'anteprima (stessa forma di quelle normalizzate dal CORE): value
 * canonico solo per i numeri positivi ed entro i limiti della specifica, così
 * computeBilateralResult mostra il risultato mentre si compila senza presentare
 * come best un valore che il salvataggio rifiuterebbe.
 */
export function toPreviewTrials(input, spec) {
  const factor = spec.unitFactors[input.setup.nativeUnit] ?? null
  return input.trials.map(trial => {
    const canonical = factor !== null && Number.isFinite(trial.nativeValue) && trial.nativeValue > 0 ? trial.nativeValue * factor : null
    return { side: trial.side, valid: trial.valid, value: canonical !== null && isWithinLimits(canonical, spec) ? canonical : null }
  })
}

function isWithinLimits(value, spec) {
  return (spec.maxValue == null || value <= spec.maxValue) && (spec.ceiling == null || value <= spec.ceiling)
}
