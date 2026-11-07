// Stato del form Handgrip (stringhe, come arrivano dagli input) ↔ input della
// callable. Le prove sono quelle comuni ai test bilaterali (bilateralFormModel).
import { LIPEDEMA_TEST_IDS, HANDGRIP, normalizeKey } from '../../utils/lipedema'
import { createPlannedTrials, trialRowsFromAssessment, trialsToInput, getTrialFieldOrder } from './bilateralFormModel'

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
    trials:         createPlannedTrials(HANDGRIP),
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
    trials:         trialRowsFromAssessment(trials),
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
    trials: trialsToInput(form),
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
  return [
    'performedAt',
    'setup.device.brand', 'setup.device.model', 'setup.device.serial', 'setup.gripSetting',
    'setup.dominantSide', 'setup.nativeUnit',
    ...getTrialFieldOrder(form), 'trials',
    'events.stoppedEarly', 'clinical.stopReasonCode', 'clinical.stopReasonNote',
    'clinical.conditionsNote', 'deviation.present', 'deviation.note', 'notes',
  ]
}

/** Chiave di confronto del dinamometro (normalizeKey del CORE, come il server) */
export function deviceModelKeyOf(brand, model) {
  return `${normalizeKey(brand)}|${normalizeKey(model)}`
}

export function gripSettingKeyOf(gripSetting) {
  return normalizeKey(gripSetting)
}
