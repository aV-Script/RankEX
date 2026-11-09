// Etichette dei test Lipedema e dei loro campi (ADR-009 §6): solo client, il
// server conosce solo i codici (functions/src/shared/lipedema.js è volutamente
// senza label, come testsMeta.js). Protocolli: lipidemia/*.docx.
// Comportamento per test (form, dettaglio, formattazione) nel registro
// features/assessments/assessmentRegistry.js: qui solo dati.
import { LIPEDEMA_TEST_IDS, TWO_MINUTE_WALK, SIT_TO_STAND_30S, HANDGRIP, HHD_QUADRICEPS, ONE_LEG_STANDING } from '../utils/lipedema'

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
  { value: 'cramps',                label: 'Crampi importanti' },
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

// HHD: fissaggio e punto del sensore (FIXATION_METHODS, SENSOR_POSITIONS)
export const FIXATION_OPTIONS = [
  { value: 'belt',   label: 'CINGHIA ESTERNA' },
  { value: 'manual', label: 'MANUALE' },
]

export const SENSOR_POSITION_OPTIONS = [
  { value: 'distal_anterior_tibia', label: 'Anteriore distale, appena sopra la caviglia' },
  { value: 'other',                 label: 'Altro' },
]

// OLS: come è finita la prova, calzature e superficie (OLS_END_REASONS, OLS_FOOTWEAR, OLS_SURFACES)
export const OLS_END_REASON_OPTIONS = [
  { value: 'foot_touch',      label: "Piede libero tocca il pavimento o l'altro arto" },
  { value: 'support_used',    label: 'Uso di supporto' },
  { value: 'stance_shift',    label: "Spostamento dell'arto di appoggio" },
  { value: 'subject_request', label: 'Richiesta della paziente' },
  { value: 'ceiling',         label: '60,0 s raggiunti' },
  { value: 'safety_stop',     label: 'Stop per sicurezza' },
]

export const FOOTWEAR_OPTIONS = [
  { value: 'barefoot', label: 'SCALZA' },
  { value: 'shoes',    label: 'SCARPE' },
]

export const SURFACE_OPTIONS = [
  { value: 'hard_floor', label: 'Pavimento rigido' },
  { value: 'other',      label: 'Altro' },
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
  fixation:    'fissaggio diverso',
  kneeAngle:   'angolo del ginocchio diverso',
  hipAngle:    "angolo dell'anca diverso",
  sensor:      'punto del sensore diverso',
  maxDuration: 'durata massima diversa',
  footwear:    'calzature diverse',
  surface:     'superficie diversa',
}

// Differenze solo informative (utils/lipedema.js → COMPARABILITY_INFO_RULES), ADR-019
export const COMPARABILITY_INFO_LABELS = {
  serial:        'seriale diverso',
  serialMissing: 'seriale non registrato',
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

// Handgrip e HHD: appoggio/assistenza è dell'OLS
const LIMB_INVALID_REASON_OPTIONS = INVALID_TRIAL_REASON_OPTIONS.filter(option => option.value !== 'support_or_assistance')

// HHD: nessuna impugnatura, la tecnica riguarda la cinghia
const HHD_INVALID_REASON_OPTIONS = LIMB_INVALID_REASON_OPTIONS.map(option => (
  option.value === 'technique_error' ? { ...option, label: 'Errore di tecnica (posizione, compensazione, cinghia)' } : option
))

// OLS: nessun dispositivo; l'appoggio è il motivo tipico di una prova non valida
const OLS_INVALID_REASON_OPTIONS = INVALID_TRIAL_REASON_OPTIONS
  .filter(option => ONE_LEG_STANDING.invalidReasons.includes(option.value))
  .map(option => {
    if (option.value === 'technique_error') return { ...option, label: 'Errore di tecnica (posizione o avvio)' }
    if (option.value === 'timing_error') return { ...option, label: 'Errore di cronometraggio' }
    return option
  })

/**
 * Una voce per test implementato. `stopReasonOptions` e `clinicalRows` sono
 * quelli del test (catalogo stop filtrato per test, righe cliniche ammesse).
 * Bilaterali, facoltativi: `strongestLabel` (default "Più forte"),
 * `endReasonOptions` (motivo di fine per prova), `hasTrialPain: false`.
 * `visitLabel`, facoltativo: etichetta nella sequenza di visita (default `shortName`).
 * `unitLabel`: unità per esteso, per l'alternativa testuale del grafico.
 */
export const LIPEDEMA_TESTS = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: {
    id:        LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK,
    shortName: '2MWT',
    name:      '2-Minute Walk Test',
    unit:      'm',
    unitLabel: 'metri',
    protocolVersion:   TWO_MINUTE_WALK.protocolVersion,
    stopReasonOptions: STOP_REASON_OPTIONS,
    clinicalRows:      CLINICAL_ROWS,
  },
  [LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S]: {
    id:        LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S,
    shortName: '30s-STS',
    name:      'Test Sit-to-Stand di 30 secondi',
    unit:      'rip.',
    unitLabel: 'ripetizioni',
    protocolVersion:   SIT_TO_STAND_30S.protocolVersion,
    stopReasonOptions: STOP_REASON_OPTIONS,
    clinicalRows:      SIT_TO_STAND_CLINICAL_ROWS,
  },
  [LIPEDEMA_TEST_IDS.HANDGRIP]: {
    id:        LIPEDEMA_TEST_IDS.HANDGRIP,
    shortName: 'Handgrip',
    visitLabel: 'HANDGRIP',
    name:      'Handgrip Dynamometry',
    unit:      HANDGRIP.canonicalUnit,
    unitLabel: 'newton',
    limbName:  'mano',
    protocolVersion:      HANDGRIP.protocolVersion,
    stopReasonOptions:    LIMB_STOP_REASON_OPTIONS,
    clinicalRows:         [],
    invalidReasonOptions: LIMB_INVALID_REASON_OPTIONS,
  },
  [LIPEDEMA_TEST_IDS.HHD_QUADRICEPS]: {
    id:        LIPEDEMA_TEST_IDS.HHD_QUADRICEPS,
    shortName: 'HHD',
    name:      'Handheld Dynamometry · Quadricipite',
    unit:      HHD_QUADRICEPS.canonicalUnit,
    unitLabel: 'newton',
    limbName:  'gamba',
    protocolVersion:      HHD_QUADRICEPS.protocolVersion,
    stopReasonOptions:    LIMB_STOP_REASON_OPTIONS,
    clinicalRows:         [],
    invalidReasonOptions: HHD_INVALID_REASON_OPTIONS,
  },
  [LIPEDEMA_TEST_IDS.ONE_LEG_STANDING]: {
    id:        LIPEDEMA_TEST_IDS.ONE_LEG_STANDING,
    shortName: 'OLS',
    name:      'One-Leg Standing',
    unit:      ONE_LEG_STANDING.canonicalUnit,
    unitLabel: 'secondi',
    limbName:  'gamba',
    protocolVersion:      ONE_LEG_STANDING.protocolVersion,
    stopReasonOptions:    LIMB_STOP_REASON_OPTIONS,
    clinicalRows:         [],
    invalidReasonOptions: OLS_INVALID_REASON_OPTIONS,
    endReasonOptions:     OLS_END_REASON_OPTIONS,
    strongestLabel:       'Tempo maggiore',
    hasTrialPain:         false,
  },
}

// Ordine di visualizzazione nello storico, nel selettore e nel riepilogo paziente
export const LIPEDEMA_TEST_ORDER = [
  LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK,
  LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S,
  LIPEDEMA_TEST_IDS.HANDGRIP,
  LIPEDEMA_TEST_IDS.HHD_QUADRICEPS,
  LIPEDEMA_TEST_IDS.ONE_LEG_STANDING,
]

export function getFixationLabel(value) {
  return FIXATION_OPTIONS.find(option => option.value === value)?.label ?? value
}

export function getSensorPositionLabel(value) {
  return SENSOR_POSITION_OPTIONS.find(option => option.value === value)?.label ?? value
}

export function getFootwearLabel(value) {
  return FOOTWEAR_OPTIONS.find(option => option.value === value)?.label ?? value
}

export function getSurfaceLabel(value) {
  return SURFACE_OPTIONS.find(option => option.value === value)?.label ?? value
}

/** Etichetta del motivo di fine, dalle `endReasonOptions` del test */
export function getEndReasonLabel(value, options = []) {
  return options.find(option => option.value === value)?.label ?? value
}

/** Come si chiama il lato con il valore maggiore: "Più forte" non vale per un tempo */
export function getStrongestLabel(testId) {
  return LIPEDEMA_TESTS[testId]?.strongestLabel ?? 'Più forte'
}

export function getAssistiveDeviceLabel(value) {
  return ASSISTIVE_DEVICE_OPTIONS.find(option => option.value === value)?.label ?? value
}

/** Etichetta del motivo di stop, da qualunque catalogo (i codici condivisi hanno la stessa etichetta) */
export function getStopReasonLabel(value) {
  return [...STOP_REASON_OPTIONS, ...LIMB_STOP_REASON_OPTIONS].find(option => option.value === value)?.label ?? value
}

/** Etichetta del motivo: `options` del test, se ne ha di proprie */
export function getInvalidTrialReasonLabel(value, options = INVALID_TRIAL_REASON_OPTIONS) {
  return options.find(option => option.value === value)?.label ?? value
}

export function getDominantSideLabel(value) {
  return DOMINANT_SIDE_OPTIONS.find(option => option.value === value)?.label ?? value
}
