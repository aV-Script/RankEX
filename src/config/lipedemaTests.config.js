// Etichette dei test Lipedema e dei loro campi (ADR-009 §6): solo client, il
// server conosce solo i codici (functions/src/shared/lipedema.js è volutamente
// senza label, come testsMeta.js). Protocolli: lipidemia/*.docx.
// Comportamento per test (form, dettaglio, formattazione) nel registro
// features/assessments/assessmentRegistry.js: qui solo dati.
import { LIPEDEMA_TEST_IDS, TWO_MINUTE_WALK, SIT_TO_STAND_30S, HANDGRIP } from '../utils/lipedema'

export const ASSISTIVE_DEVICE_OPTIONS = [
  { value: 'none',     label: 'Nessuno' },
  { value: 'cane',     label: 'Bastone' },
  { value: 'crutch',   label: 'Stampella' },
  { value: 'rollator', label: 'Rollator' },
  { value: 'other',    label: 'Altro' },
]

// Stop clinico ≠ deviazione dal protocollo: sono due campi separati (2MWT, 30s-STS)
export const STOP_REASON_OPTIONS = [
  { value: 'chest_pain',        label: 'Dolore toracico' },
  { value: 'dyspnea',           label: 'Dispnea intollerabile' },
  { value: 'dizziness',         label: 'Capogiro / presincope / malessere' },
  { value: 'lower_limb_pain',   label: 'Dolore o crampi agli arti inferiori' },
  { value: 'instability',       label: 'Instabilità / rischio di caduta' },
  { value: 'patient_request',   label: 'Richiesta del paziente' },
  { value: 'examiner_decision', label: 'Decisione del professionista' },
  { value: 'other',             label: 'Altro' },
]

// Interruzione dei test bilaterali (LIMB_STOP_REASON_CODES, docx 03 §19)
export const LIMB_STOP_REASON_OPTIONS = [
  { value: 'acute_pain',            label: 'Dolore acuto o crescente' },
  { value: 'neurological_symptoms', label: 'Sintomi neurologici nuovi' },
  { value: 'dizziness',             label: 'Capogiro / presincope / malessere' },
  { value: 'loss_of_control',       label: "Perdita di controllo dell'arto" },
  { value: 'instability',           label: 'Instabilità / rischio di caduta' },
  { value: 'contraindication',      label: 'Controindicazione clinica' },
  { value: 'patient_request',       label: 'Richiesta del paziente' },
  { value: 'examiner_decision',     label: 'Decisione del professionista' },
  { value: 'other',                 label: 'Altro' },
]

// Motivi di una prova non valida (INVALID_TRIAL_REASONS). 'support_or_assistance'
// è dell'OLS: nell'Handgrip non si offre
export const INVALID_TRIAL_REASON_OPTIONS = [
  { value: 'technique_error',       label: 'Errore di tecnica (posizione, compensazione, impugnatura)' },
  { value: 'timing_error',          label: 'Errore di tempo' },
  { value: 'support_or_assistance', label: 'Appoggio o assistenza' },
  { value: 'external_interruption', label: 'Interruzione esterna' },
  { value: 'device_error',          label: 'Errore dello strumento' },
  { value: 'other',                 label: 'Altro' },
]

// Lati dei test bilaterali: valgono per mano e gamba
export const SIDE_LABELS = {
  R: { short: 'D', label: 'destra',   upper: 'DESTRA' },
  L: { short: 'S', label: 'sinistra', upper: 'SINISTRA' },
}

export const DOMINANT_SIDE_OPTIONS = [
  { value: 'R',    label: 'DESTRA' },
  { value: 'L',    label: 'SINISTRA' },
  { value: 'both', label: 'ENTRAMBE' },
]

// Motivi di non comparabilità (utils/lipedema.js → COMPARABILITY_RULES)
export const COMPARABILITY_REASON_LABELS = {
  protocol:    'protocollo diverso',
  course:      'percorso diverso',
  device:      'ausilio diverso',
  chairHeight: 'altezza sedia diversa',
  armrests:    'braccioli diversi',
  armsCrossed: 'posizione delle braccia diversa',
  dynamometer: 'dinamometro diverso',
  grip:        'impugnatura diversa',
}

// Parametri clinici facoltativi: una riga per misura, colonne PRE | POST.
// Nessun colore o giudizio sui valori (docx 01 §23)
export const CLINICAL_ROWS = [
  { label: 'Dolore (NRS 0–10)',      pre: 'painPre',    post: 'painPost',    step: 1 },
  { label: 'Dispnea (Borg 0–10)',    pre: 'dyspneaPre', post: 'dyspneaPost', step: 0.5 },
  { label: 'Fatica (Borg 0–10)',     pre: 'fatiguePre', post: 'fatiguePost', step: 0.5 },
  { label: 'FC (bpm)',               pre: 'hrPreBpm',   post: 'hrPostBpm',   step: 1 },
  { label: 'SpO₂ (%)',               pre: 'spo2PrePct', post: 'spo2PostPct', step: 1 },
  { label: 'PA sistolica (mmHg)',    pre: 'bpSysPre',   post: 'bpSysPost',   step: 1 },
  { label: 'PA diastolica (mmHg)',   pre: 'bpDiaPre',   post: 'bpDiaPost',   step: 1 },
]

// 30s-STS: niente FC/SpO₂/PA (ADR-016 §6)
const SIT_TO_STAND_CLINICAL_ROWS = CLINICAL_ROWS.filter(row => ['painPre', 'dyspneaPre', 'fatiguePre'].includes(row.pre))

/**
 * Una voce per test implementato. `stopReasonOptions` e `clinicalRows` sono
 * quelli del test (catalogo stop filtrato per test, righe cliniche ammesse).
 */
export const LIPEDEMA_TESTS = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: {
    id:        LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK,
    shortName: '2MWT',
    name:      '2-Minute Walk Test',
    unit:      'm',
    protocolVersion:   TWO_MINUTE_WALK.protocolVersion,
    stopReasonOptions: STOP_REASON_OPTIONS,
    clinicalRows:      CLINICAL_ROWS,
  },
  [LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S]: {
    id:        LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S,
    shortName: '30s-STS',
    name:      'Test Sit-to-Stand di 30 secondi',
    unit:      'rip.',
    protocolVersion:   SIT_TO_STAND_30S.protocolVersion,
    stopReasonOptions: STOP_REASON_OPTIONS,
    clinicalRows:      SIT_TO_STAND_CLINICAL_ROWS,
  },
  [LIPEDEMA_TEST_IDS.HANDGRIP]: {
    id:        LIPEDEMA_TEST_IDS.HANDGRIP,
    shortName: 'Handgrip',
    name:      'Handgrip Dynamometry',
    unit:      HANDGRIP.canonicalUnit,
    protocolVersion:      HANDGRIP.protocolVersion,
    stopReasonOptions:    LIMB_STOP_REASON_OPTIONS,
    clinicalRows:         [],
    invalidReasonOptions: INVALID_TRIAL_REASON_OPTIONS.filter(option => option.value !== 'support_or_assistance'),
  },
}

// Ordine di visualizzazione nello storico, nel selettore e nel riepilogo paziente
export const LIPEDEMA_TEST_ORDER = [
  LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK,
  LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S,
  LIPEDEMA_TEST_IDS.HANDGRIP,
]

export function getAssistiveDeviceLabel(value) {
  return ASSISTIVE_DEVICE_OPTIONS.find(option => option.value === value)?.label ?? value
}

/** Etichetta del motivo di stop, da qualunque catalogo (i codici condivisi hanno la stessa etichetta) */
export function getStopReasonLabel(value) {
  return [...STOP_REASON_OPTIONS, ...LIMB_STOP_REASON_OPTIONS].find(option => option.value === value)?.label ?? value
}

export function getInvalidTrialReasonLabel(value) {
  return INVALID_TRIAL_REASON_OPTIONS.find(option => option.value === value)?.label ?? value
}

export function getDominantSideLabel(value) {
  return DOMINANT_SIDE_OPTIONS.find(option => option.value === value)?.label ?? value
}
