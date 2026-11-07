// Stato del form One-Leg Standing (stringhe, come arrivano dagli input) ↔ input
// della callable (ADR-018). Le prove sono quelle comuni ai test bilaterali, più il
// motivo di fine.
import {
  LIPEDEMA_TEST_IDS, ONE_LEG_STANDING, OLS_SURFACES, computeOlsComparability, getComparabilityIssues,
} from '../../utils/lipedema'
import { toNumber, toText } from './formModelUtils'
import { createPlannedTrials, trialRowsFromAssessment, trialsToInput, getTrialFieldOrder } from './bilateralFormModel'

const [STANDARD_SURFACE] = OLS_SURFACES
const CEILING_END_REASON = 'ceiling'

// Campi da cui dipende ogni motivo di non comparabilità: finché uno non è valido
// non si avvisa (un campo svuotato per riscriverlo non è un parametro diverso)
const COMPARABILITY_REASON_FIELDS = {
  footwear: ['setup.footwear'],
  surface:  ['setup.surface', 'setup.surfaceNote'],
}

/**
 * Form nuovo. Setup dall'ultimo OLS valido (ADR-016 §5). Calzature e gamba dominante
 * restano da scegliere: un default le registrerebbe senza che nessuno le abbia
 * controllate. Il dolore e i sintomi sono di quella seduta: non si precompilano.
 * @param {string}      nowLocal    — 'YYYY-MM-DDTHH:mm'
 * @param {object|null} previous    — ultimo OLS valido del paziente
 * @param {string|null} dominantLeg — gamba dominante dall'ultima HHD o OLS
 */
export function createOlsForm(nowLocal, previous = null, dominantLeg = null) {
  const setup = previous?.setup ?? {}
  return {
    performedAt:         nowLocal,
    dominantSide:        dominantLeg ?? setup.dominantSide ?? '',
    footwear:            setup.footwear ?? '',
    surface:             setup.surface ?? STANDARD_SURFACE,
    surfaceNote:         setup.surfaceNote ?? '',
    assistiveDevice:     setup.assistiveDevice ?? 'none',
    assistiveDeviceNote: setup.assistiveDeviceNote ?? '',
    nativeUnit:          ONE_LEG_STANDING.canonicalUnit,
    trials:              createPlannedTrials(ONE_LEG_STANDING),
    stoppedEarly:        false,
    stopReasonCode:      '',
    stopReasonNote:      '',
    clinical:            { pain: '', symptomsNote: '' },
    conditionsNote:      '',
    deviationPresent:    false,
    deviationNote:       '',
    notes:               '',
  }
}

/** Form precompilato da una valutazione salvata (Correggi) */
export function olsFormFromAssessment(assessment) {
  const { setup = {}, trials = [], events = {}, clinical = {}, deviation = {} } = assessment
  return {
    performedAt:         assessment.performedAt,
    dominantSide:        setup.dominantSide ?? '',
    footwear:            setup.footwear ?? '',
    surface:             setup.surface ?? STANDARD_SURFACE,
    surfaceNote:         setup.surfaceNote ?? '',
    assistiveDevice:     setup.assistiveDevice ?? 'none',
    assistiveDeviceNote: setup.assistiveDeviceNote ?? '',
    nativeUnit:          ONE_LEG_STANDING.canonicalUnit,
    trials:              trialRowsFromAssessment(trials),
    stoppedEarly:        events.stoppedEarly === true,
    stopReasonCode:      clinical.stopReasonCode ?? '',
    stopReasonNote:      clinical.stopReasonNote ?? '',
    clinical:            { pain: toText(clinical.pain), symptomsNote: clinical.symptomsNote ?? '' },
    conditionsNote:      clinical.conditionsNote ?? '',
    deviationPresent:    deviation.present === true,
    deviationNote:       deviation.note ?? '',
    notes:               assessment.notes ?? '',
  }
}

/** Input della callable: il client non manda mai value/result/ceiling (li calcola il server) */
export function buildOlsInput(form) {
  return {
    testId:      LIPEDEMA_TEST_IDS.ONE_LEG_STANDING,
    performedAt: form.performedAt,
    setup: {
      dominantSide:        form.dominantSide || null,
      footwear:            form.footwear || null,
      surface:             form.surface,
      surfaceNote:         form.surface === 'other' ? form.surfaceNote : null,
      assistiveDevice:     form.assistiveDevice,
      assistiveDeviceNote: form.assistiveDevice === 'other' ? form.assistiveDeviceNote : null,
      nativeUnit:          form.nativeUnit,
    },
    trials: trialsToInput(form, row => ({ endReason: row.endReason || null })),
    events: { stoppedEarly: form.stoppedEarly },
    clinical: {
      pain:           toNumber(form.clinical.pain),
      symptomsNote:   form.clinical.symptomsNote,
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
export function getOlsFieldOrder(form) {
  return [
    'performedAt',
    'setup.dominantSide', 'setup.footwear', 'setup.surface', 'setup.surfaceNote',
    'setup.assistiveDevice', 'setup.assistiveDeviceNote', 'clinical.pain', 'clinical.symptomsNote',
    ...getTrialFieldOrder(form), 'trials',
    'events.stoppedEarly', 'clinical.stopReasonCode', 'clinical.stopReasonNote',
    'clinical.conditionsNote', 'deviation.present', 'deviation.note', 'notes',
  ]
}

/**
 * Regola di riga: a 60,0 s un motivo di fine ancora vuoto diventa il tempo massimo,
 * e lo si toglie se il tempo cambia. Un motivo scelto a mano non si tocca: se non è
 * coerente col tetto lo segnala la validazione, senza perderlo per un refuso.
 */
export function applyOlsRowPatch(row, next) {
  const isCeiling  = toNumber(next.nativeValue) === ONE_LEG_STANDING.ceiling
  const wasCeiling = toNumber(row.nativeValue) === ONE_LEG_STANDING.ceiling
  if (isCeiling) return next.endReason ? next : { ...next, endReason: CEILING_END_REASON }
  return wasCeiling && next.endReason === CEILING_END_REASON ? { ...next, endReason: '' } : next
}

/**
 * Motivi di non comparabilità con la valutazione di riferimento, solo sui campi
 * già validi.
 * @param {object}      form
 * @param {object}      errors   — errori della validazione (anche non ancora mostrati)
 * @param {object|null} previous — ultimo OLS valido
 * @returns {string[]}
 */
export function getOlsComparabilityWarnings(form, errors, previous) {
  if (!previous) return []
  const current = { testId: LIPEDEMA_TEST_IDS.ONE_LEG_STANDING, comparability: olsComparabilityOf(form) }
  return getComparabilityIssues(current, previous)
    .filter(reason => !(COMPARABILITY_REASON_FIELDS[reason] ?? []).some(field => errors[field]))
}

/** Snapshot di comparabilità del form, lo stesso che salverà il server */
export function olsComparabilityOf(form) {
  return computeOlsComparability({ footwear: form.footwear, surface: form.surface, surfaceNote: form.surfaceNote })
}
