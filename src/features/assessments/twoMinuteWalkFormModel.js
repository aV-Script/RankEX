// Stato del form 2MWT (stringhe, come arrivano dagli input) ↔ input della
// callable (numeri o null). La validazione è quella condivisa col server
// (utils/lipedema.js → validateAssessmentInput): qui solo la conversione.
import { LIPEDEMA_TEST_IDS, TWO_MINUTE_WALK, CLINICAL_RANGES } from '../../utils/lipedema'
import {
  fieldId, toNumber, toText, emptyClinical, clinicalFromAssessment, clinicalToInput, countFilledClinical,
} from './formModelUtils'

export { fieldId, toNumber }

const CLINICAL_KEYS = Object.keys(CLINICAL_RANGES)

// Ordine dei campi a schermo: il primo errore in quest'ordine riceve il focus
export const FIELD_ORDER = [
  'performedAt',
  'setup.courseLengthM', 'setup.variantConfirmed', 'setup.assistiveDevice', 'setup.assistiveDeviceNote',
  'trial.fullLengths', 'trial.partialDistanceM',
  'events.stoppedEarly', 'events.stopTimeS', 'clinical.stopReasonCode', 'clinical.stopReasonNote',
  'events.pauseCount', 'events.pauseDurationS',
  ...CLINICAL_KEYS.map(key => `clinical.${key}`), 'clinical.conditionsNote',
  'deviation.present', 'deviation.note', 'notes',
]

// Campi senza i quali la distanza non è calcolabile (riepilogo live a "—")
export const RESULT_FIELDS = ['setup.courseLengthM', 'trial.fullLengths', 'trial.partialDistanceM', 'events.stopTimeS']

/** Ordine dei campi per il focus sul primo errore (useAssessmentForm) */
export function getTwoMinuteWalkFieldOrder() {
  return FIELD_ORDER
}

/** @param {string} nowLocal — 'YYYY-MM-DDTHH:mm' */
export function createTwoMinuteWalkForm(nowLocal) {
  return {
    performedAt:         nowLocal,
    courseLengthM:       String(TWO_MINUTE_WALK.standardCourseLengthM),
    variantConfirmed:    false,
    assistiveDevice:     'none',
    assistiveDeviceNote: '',
    fullLengths:         '0',
    partialDistanceM:    '',
    stoppedEarly:        false,
    stopTimeS:           '',
    stopReasonCode:      '',
    stopReasonNote:      '',
    pauseCount:          '0',
    pauseDurationS:      '',
    clinical:            emptyClinical(CLINICAL_KEYS),
    conditionsNote:      '',
    deviationPresent:    false,
    deviationNote:       '',
    notes:               '',
  }
}

/**
 * Form precompilato da una valutazione salvata, per "Correggi" (ADR-011): stessa
 * data/ora della prova originale, la variante resta da riconfermare.
 */
export function formFromAssessment(assessment) {
  const { setup = {}, trials = [], events = {}, clinical = {}, deviation = {} } = assessment
  const trial = trials[0] ?? {}
  return {
    performedAt:         assessment.performedAt,
    courseLengthM:       toText(setup.courseLengthM),
    variantConfirmed:    false,
    assistiveDevice:     setup.assistiveDevice ?? 'none',
    assistiveDeviceNote: setup.assistiveDeviceNote ?? '',
    fullLengths:         toText(trial.fullLengths),
    partialDistanceM:    toText(trial.partialDistanceM),
    stoppedEarly:        events.stopTimeS !== null && events.stopTimeS !== undefined,
    stopTimeS:           toText(events.stopTimeS),
    stopReasonCode:      clinical.stopReasonCode ?? '',
    stopReasonNote:      clinical.stopReasonNote ?? '',
    pauseCount:          toText(events.pauseCount ?? 0),
    pauseDurationS:      events.pauseCount > 0 ? toText(events.pauseDurationS) : '',
    clinical:            clinicalFromAssessment(CLINICAL_KEYS, clinical),
    conditionsNote:      clinical.conditionsNote ?? '',
    deviationPresent:    deviation.present === true,
    deviationNote:       deviation.note ?? '',
    notes:               assessment.notes ?? '',
  }
}

/** Input della callable: numeri o null, testi così come sono (li ripulisce la validazione) */
export function buildTwoMinuteWalkInput(form) {
  return {
    testId:      LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK,
    performedAt: form.performedAt,
    setup: {
      courseLengthM:       toNumber(form.courseLengthM),
      variantConfirmed:    form.variantConfirmed,
      assistiveDevice:     form.assistiveDevice,
      assistiveDeviceNote: form.assistiveDevice === 'other' ? form.assistiveDeviceNote : null,
    },
    trial: {
      fullLengths:      toNumber(form.fullLengths),
      partialDistanceM: toNumber(form.partialDistanceM),
    },
    events: {
      stoppedEarly:   form.stoppedEarly,
      stopTimeS:      form.stoppedEarly ? toNumber(form.stopTimeS) : null,
      pauseCount:     toNumber(form.pauseCount),
      pauseDurationS: toNumber(form.pauseCount) > 0 ? toNumber(form.pauseDurationS) : null,
    },
    clinical: {
      ...clinicalToInput(CLINICAL_KEYS, form.clinical),
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

/** Quanti parametri clinici facoltativi sono compilati (contatore della sezione) */
export function countClinicalFilled(form) {
  return countFilledClinical(CLINICAL_KEYS, form)
}
