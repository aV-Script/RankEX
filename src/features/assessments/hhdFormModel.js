// Stato del form HHD quadricipite (stringhe, come arrivano dagli input) ↔ input
// della callable (ADR-017). Le prove sono quelle comuni ai test bilaterali.
import { LIPEDEMA_TEST_IDS, HHD_QUADRICEPS, SENSOR_POSITIONS, computeHhdComparability, getComparabilityIssues } from '../../utils/lipedema'
import { toNumber, toText } from './formModelUtils'
import { createPlannedTrials, trialRowsFromAssessment, trialsToInput, getTrialFieldOrder } from './bilateralFormModel'

const [STANDARD_SENSOR_POSITION] = SENSOR_POSITIONS

// Campi da cui dipende ogni motivo di non comparabilità: finché uno non è valido
// non si avvisa (un campo svuotato per riscriverlo non è un parametro diverso)
const COMPARABILITY_REASON_FIELDS = {
  dynamometer: ['setup.device.brand', 'setup.device.model'],
  fixation:    ['setup.fixationMethod'],
  kneeAngle:   ['setup.kneeAngleDeg'],
  hipAngle:    ['setup.hipAngleDeg'],
  sensor:      ['setup.sensorPosition', 'setup.sensorPositionNote'],
}

/**
 * Form nuovo. Setup dall'ultima HHD valida (ADR-016 §5), altrimenti i default del
 * protocollo. Fissaggio e lato dominante restano da scegliere: un default li
 * registrerebbe senza che nessuno li abbia controllati. La contrazione riparte
 * sempre da quella standard: una durata diversa è una deviazione di quella seduta.
 * @param {string}      nowLocal — 'YYYY-MM-DDTHH:mm'
 * @param {object|null} previous — ultima HHD valida del paziente
 * @param {string|null} dominantLeg — gamba dominante dall'ultima HHD o OLS (ADR-016 §5)
 */
export function createHhdForm(nowLocal, previous = null, dominantLeg = null) {
  const setup = previous?.setup ?? {}
  return {
    performedAt:         nowLocal,
    deviceBrand:         setup.device?.brand ?? '',
    deviceModel:         setup.device?.model ?? '',
    deviceSerial:        setup.device?.serial ?? '',
    fixationMethod:      setup.fixationMethod ?? '',
    kneeAngleDeg:        toText(setup.kneeAngleDeg ?? HHD_QUADRICEPS.standardKneeAngleDeg),
    hipAngleDeg:         toText(setup.hipAngleDeg ?? HHD_QUADRICEPS.standardHipAngleDeg),
    sensorPosition:      setup.sensorPosition ?? STANDARD_SENSOR_POSITION,
    sensorPositionNote:  setup.sensorPositionNote ?? '',
    contractionS:        toText(HHD_QUADRICEPS.standardContractionS),
    dominantSide:        dominantLeg ?? setup.dominantSide ?? '',
    nativeUnit:          setup.nativeUnit ?? HHD_QUADRICEPS.canonicalUnit,
    assistiveDevice:     setup.assistiveDevice ?? 'none',
    assistiveDeviceNote: setup.assistiveDeviceNote ?? '',
    trials:              createPlannedTrials(HHD_QUADRICEPS),
    stoppedEarly:        false,
    stopReasonCode:      '',
    stopReasonNote:      '',
    clinical:            { painPre: '' },
    conditionsNote:      '',
    deviationPresent:    false,
    deviationNote:       '',
    notes:               '',
  }
}

/** Form precompilato da una valutazione salvata (Correggi) */
export function hhdFormFromAssessment(assessment) {
  const { setup = {}, trials = [], events = {}, clinical = {}, deviation = {} } = assessment
  return {
    performedAt:         assessment.performedAt,
    deviceBrand:         setup.device?.brand ?? '',
    deviceModel:         setup.device?.model ?? '',
    deviceSerial:        setup.device?.serial ?? '',
    fixationMethod:      setup.fixationMethod ?? '',
    kneeAngleDeg:        toText(setup.kneeAngleDeg),
    hipAngleDeg:         toText(setup.hipAngleDeg),
    sensorPosition:      setup.sensorPosition ?? STANDARD_SENSOR_POSITION,
    sensorPositionNote:  setup.sensorPositionNote ?? '',
    contractionS:        toText(setup.contractionS),
    dominantSide:        setup.dominantSide ?? '',
    nativeUnit:          setup.nativeUnit ?? HHD_QUADRICEPS.canonicalUnit,
    assistiveDevice:     setup.assistiveDevice ?? 'none',
    assistiveDeviceNote: setup.assistiveDeviceNote ?? '',
    trials:              trialRowsFromAssessment(trials),
    stoppedEarly:        events.stoppedEarly === true,
    stopReasonCode:      clinical.stopReasonCode ?? '',
    stopReasonNote:      clinical.stopReasonNote ?? '',
    clinical:            { painPre: toText(clinical.painPre) },
    conditionsNote:      clinical.conditionsNote ?? '',
    deviationPresent:    deviation.present === true,
    deviationNote:       deviation.note ?? '',
    notes:               assessment.notes ?? '',
  }
}

/** Input della callable: il client non manda mai value/result (li calcola il server) */
export function buildHhdInput(form) {
  return {
    testId:      LIPEDEMA_TEST_IDS.HHD_QUADRICEPS,
    performedAt: form.performedAt,
    setup: {
      dominantSide:        form.dominantSide || null,
      device:              { brand: form.deviceBrand, model: form.deviceModel, serial: form.deviceSerial },
      fixationMethod:      form.fixationMethod || null,
      kneeAngleDeg:        toNumber(form.kneeAngleDeg),
      hipAngleDeg:         toNumber(form.hipAngleDeg),
      sensorPosition:      form.sensorPosition,
      sensorPositionNote:  form.sensorPosition === 'other' ? form.sensorPositionNote : null,
      contractionS:        toNumber(form.contractionS),
      assistiveDevice:     form.assistiveDevice,
      assistiveDeviceNote: form.assistiveDevice === 'other' ? form.assistiveDeviceNote : null,
      nativeUnit:          form.nativeUnit,
    },
    trials: trialsToInput(form),
    events: { stoppedEarly: form.stoppedEarly },
    clinical: {
      painPre:        toNumber(form.clinical.painPre),
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
export function getHhdFieldOrder(form) {
  return [
    'performedAt',
    'setup.device.brand', 'setup.device.model', 'setup.device.serial', 'setup.fixationMethod',
    'setup.kneeAngleDeg', 'setup.hipAngleDeg', 'setup.contractionS',
    'setup.sensorPosition', 'setup.sensorPositionNote', 'setup.dominantSide', 'setup.nativeUnit',
    'clinical.painPre', 'setup.assistiveDevice', 'setup.assistiveDeviceNote',
    ...getTrialFieldOrder(form), 'trials',
    'events.stoppedEarly', 'clinical.stopReasonCode', 'clinical.stopReasonNote',
    'clinical.conditionsNote', 'deviation.present', 'deviation.note', 'notes',
  ]
}

/** Contrazione diversa da quella standard: il server richiede la deviazione */
export function isHhdDeviationRequired(form) {
  const contractionS = toNumber(form.contractionS)
  return Number.isFinite(contractionS) && contractionS > 0 && contractionS !== HHD_QUADRICEPS.standardContractionS
}

/**
 * Nuova contrazione. Fuori standard attiva la deviazione. Tornando allo standard
 * la spegne solo se non è stata descritta: un testo scritto non si butta, lo
 * decide chi compila (il campo si sblocca).
 */
export function applyContractionChange(form, contractionS) {
  const next = { ...form, contractionS }
  if (isHhdDeviationRequired(next)) return { ...next, deviationPresent: true }
  const wasRequired = isHhdDeviationRequired(form)
  return wasRequired && form.deviationNote.trim() === '' ? { ...next, deviationPresent: false } : next
}

/**
 * Motivi di non comparabilità con la valutazione di riferimento, solo sui campi
 * già validi.
 * @param {object}      form
 * @param {object}      errors   — errori della validazione (anche non ancora mostrati)
 * @param {object|null} previous — ultima HHD valida
 * @returns {string[]}
 */
export function getHhdComparabilityWarnings(form, errors, previous) {
  if (!previous) return []
  const current = { testId: LIPEDEMA_TEST_IDS.HHD_QUADRICEPS, comparability: hhdComparabilityOf(form) }
  return getComparabilityIssues(current, previous)
    .filter(reason => !(COMPARABILITY_REASON_FIELDS[reason] ?? []).some(field => errors[field]))
}

/** Snapshot di comparabilità del form, lo stesso che salverà il server */
export function hhdComparabilityOf(form) {
  return computeHhdComparability({
    brand:              form.deviceBrand,
    model:              form.deviceModel,
    serial:             form.deviceSerial,
    fixationMethod:     form.fixationMethod,
    kneeAngleDeg:       toNumber(form.kneeAngleDeg),
    hipAngleDeg:        toNumber(form.hipAngleDeg),
    sensorPosition:     form.sensorPosition,
    sensorPositionNote: form.sensorPositionNote,
  })
}
