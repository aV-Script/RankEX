// Stato del form 30s-STS (stringhe, come arrivano dagli input) ↔ input della
// callable (numeri o null). La validazione è quella condivisa col server
// (utils/lipedema.js → validateAssessmentInput): qui solo la conversione.
import { LIPEDEMA_TEST_IDS, SIT_TO_STAND_30S, isStandardChairHeight } from '../../utils/lipedema'
import { LIPEDEMA_TESTS } from '../../config/lipedemaTests.config'
import {
  toNumber, toText, emptyClinical, clinicalFromAssessment, clinicalToInput, countFilledClinical, clinicalKeysOf,
} from './formModelUtils'

const CLINICAL_KEYS = clinicalKeysOf(LIPEDEMA_TESTS[LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S].clinicalRows)

// Ordine dei campi a schermo: il primo errore in quest'ordine riceve il focus
const FIELD_ORDER = [
  'performedAt',
  'setup.chairHeightCm', 'setup.variantConfirmed', 'setup.chairHasArmrests', 'setup.armsCrossed',
  'events.familiarizationDone', 'events.usedArms', 'events.usedArmsNote',
  'events.stoppedEarly', 'events.stopTimeS', 'clinical.stopReasonCode', 'clinical.stopReasonNote',
  'trial.completeRepetitions', 'trial.partialRepCounted',
  'events.technicalError', 'events.technicalErrorNote',
  'events.pauseCount', 'events.pauseDurationS',
  ...CLINICAL_KEYS.map(key => `clinical.${key}`), 'clinical.conditionsNote',
  'deviation.present', 'deviation.note', 'notes',
]

export function getSitToStandFieldOrder() {
  return FIELD_ORDER
}

// Regola della sedia standard: quella del CORE, così l'avviso coincide col server
export { isStandardChairHeight }

/** Due altezze di sedia confrontabili (stessa tolleranza ±0,5 cm, in decimi di cm) */
export function isSameChairHeight(a, b) {
  return Math.abs(Math.round(a * 10) - Math.round(b * 10)) <= Math.round(SIT_TO_STAND_30S.chairToleranceCm * 10)
}

/** Braccioli o braccia libere: la deviazione dal protocollo è obbligatoria */
export function isDeviationRequired(form) {
  return form.chairHasArmrests === true || form.armsCrossed === false
}

/** @param {string} nowLocal — 'YYYY-MM-DDTHH:mm' */
export function createSitToStandForm(nowLocal) {
  return {
    performedAt:         nowLocal,
    chairHeightCm:       String(SIT_TO_STAND_30S.standardChairHeightCm),
    variantConfirmed:    false,
    chairHasArmrests:    false,
    armsCrossed:         true,
    // Nessun default: va indicato ogni volta (docx 02 §11-12)
    familiarizationDone: null,
    usedArms:            false,
    usedArmsNote:        '',
    stoppedEarly:        false,
    stopTimeS:           '',
    stopReasonCode:      '',
    stopReasonNote:      '',
    completeRepetitions: '0',
    partialRepCounted:   false,
    technicalError:      false,
    technicalErrorNote:  '',
    pauseCount:          '0',
    pauseDurationS:      '',
    clinical:            emptyClinical(CLINICAL_KEYS),
    conditionsNote:      '',
    deviationPresent:    false,
    deviationNote:       '',
    notes:               '',
  }
}

/** Form precompilato da una valutazione salvata (Correggi): la variante resta da riconfermare */
export function sitToStandFormFromAssessment(assessment) {
  const { setup = {}, trials = [], events = {}, clinical = {}, deviation = {} } = assessment
  const trial = trials[0] ?? {}
  return {
    performedAt:         assessment.performedAt,
    chairHeightCm:       toText(setup.chairHeightCm),
    variantConfirmed:    false,
    chairHasArmrests:    setup.chairHasArmrests === true,
    armsCrossed:         setup.armsCrossed !== false,
    familiarizationDone: typeof events.familiarizationDone === 'boolean' ? events.familiarizationDone : null,
    usedArms:            events.usedArms === true,
    usedArmsNote:        events.usedArmsNote ?? '',
    stoppedEarly:        events.stopTimeS !== null && events.stopTimeS !== undefined,
    stopTimeS:           toText(events.stopTimeS),
    stopReasonCode:      clinical.stopReasonCode ?? '',
    stopReasonNote:      clinical.stopReasonNote ?? '',
    completeRepetitions: toText(trial.completeRepetitions),
    partialRepCounted:   trial.partialRepCounted === true,
    technicalError:      events.technicalError === true,
    technicalErrorNote:  events.technicalErrorNote ?? '',
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
export function buildSitToStandInput(form) {
  const isStopped = !form.usedArms && form.stoppedEarly
  return {
    testId:      LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S,
    performedAt: form.performedAt,
    setup: {
      chairHeightCm:    toNumber(form.chairHeightCm),
      variantConfirmed: form.variantConfirmed,
      chairHasArmrests: form.chairHasArmrests,
      armsCrossed:      form.armsCrossed,
    },
    trial: {
      completeRepetitions: toNumber(form.completeRepetitions),
      // La parziale finale conta solo arrivando ai 30 s (ADR-016 §6)
      partialRepCounted:   !isStopped && !form.usedArms && form.partialRepCounted,
    },
    events: {
      usedArms:            form.usedArms,
      usedArmsNote:        form.usedArms ? form.usedArmsNote : null,
      stoppedEarly:        isStopped,
      stopTimeS:           isStopped ? toNumber(form.stopTimeS) : null,
      technicalError:      form.technicalError,
      technicalErrorNote:  form.technicalError ? form.technicalErrorNote : null,
      familiarizationDone: form.familiarizationDone,
      pauseCount:          toNumber(form.pauseCount),
      pauseDurationS:      toNumber(form.pauseCount) > 0 ? toNumber(form.pauseDurationS) : null,
    },
    clinical: {
      ...clinicalToInput(CLINICAL_KEYS, form.clinical),
      stopReasonCode: isStopped ? (form.stopReasonCode || null) : null,
      stopReasonNote: isStopped ? form.stopReasonNote : null,
      conditionsNote: form.conditionsNote,
    },
    deviation: {
      present: form.deviationPresent,
      note:    form.deviationPresent ? form.deviationNote : null,
    },
    notes: form.notes,
  }
}

export function countSitToStandClinicalFilled(form) {
  return countFilledClinical(CLINICAL_KEYS, form)
}
