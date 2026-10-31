// Etichette dei test Lipedema e dei loro campi (ADR-009 §6): solo client, il
// server conosce solo i codici (functions/src/shared/lipedema.js è volutamente
// senza label, come testsMeta.js). Protocolli: lipidemia/*.docx.
import { LIPEDEMA_TEST_IDS, TWO_MINUTE_WALK } from '../utils/lipedema'

export const LIPEDEMA_TESTS = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: {
    id:        LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK,
    shortName: '2MWT',
    name:      '2-Minute Walk Test',
    unit:      'm',
    protocolVersion: TWO_MINUTE_WALK.protocolVersion,
  },
}

// Ordine di visualizzazione nello storico e nel riepilogo paziente
export const LIPEDEMA_TEST_ORDER = [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]

export const ASSISTIVE_DEVICE_OPTIONS = [
  { value: 'none',     label: 'Nessuno' },
  { value: 'cane',     label: 'Bastone' },
  { value: 'crutch',   label: 'Stampella' },
  { value: 'rollator', label: 'Rollator' },
  { value: 'other',    label: 'Altro' },
]

// Stop clinico ≠ deviazione dal protocollo: sono due campi separati
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

// Motivi di non comparabilità (utils/lipedema.js → COMPARABILITY_RULES)
export const COMPARABILITY_REASON_LABELS = {
  protocol: 'protocollo diverso',
  course:   'percorso diverso',
  device:   'ausilio diverso',
}

// Parametri clinici facoltativi del 2MWT: una riga per misura, colonne PRE | POST.
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

export function getAssistiveDeviceLabel(value) {
  return ASSISTIVE_DEVICE_OPTIONS.find(option => option.value === value)?.label ?? value
}

export function getStopReasonLabel(value) {
  return STOP_REASON_OPTIONS.find(option => option.value === value)?.label ?? value
}
