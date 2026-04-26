/**
 * Costanti BIA — Bioimpedenziometria.
 * Range clinici basati su standard OMS/ACSM/Tanita.
 */

// ── Colori qualità BIA — derivati dalla scala RANKS ───────────
// I valori corrispondono ai colori esatti dei rank per quegli score.
export const BIA_Q = {
  excellent: '#1aff6e',  // S+  (score 85)
  good:      '#00c8ff',  // A+  (score 70)
  normal:    '#38bdf8',  // B+  (score 62)
  high:      '#fb923c',  // D+  (score 42)
  bad:       '#ef4444',  // E   (score 27)
  low:       '#8a9bb0',  // F+  (score 22) — es. sottopeso, acqua bassa
  neutral:   '#4db8ff',  // A   (score 65) — parametri senza range clinico
}

// ── Parametri BIA ─────────────────────────────────────────────
export const BIA_PARAMS = [
  {
    key:       'fatMassPercent',
    label:     'Massa grassa',
    unit:      '%',
    direction: 'inverse',   // meno è meglio
  },
  {
    key:       'muscleMassKg',
    label:     'Massa muscolare',
    unit:      'kg',
    direction: 'direct',    // più è meglio
  },
  {
    key:       'waterPercent',
    label:     'Acqua corporea',
    unit:      '%',
    direction: 'direct',
  },
  {
    key:       'boneMassKg',
    label:     'Massa ossea',
    unit:      'kg',
    direction: 'direct',
  },
  {
    key:       'bmi',
    label:     'BMI',
    unit:      'kg/m²',
    direction: 'neutral',   // range ottimale centrale
    computed:  true,        // calcolato da peso/altezza
  },
  {
    key:       'bmrKcal',
    label:     'Metabolismo basale',
    unit:      'kcal',
    direction: 'neutral',
  },
  {
    key:       'metabolicAge',
    label:     'Età metabolica',
    unit:      'anni',
    direction: 'inverse',   // meglio se < età anagrafica
  },
  {
    key:       'visceralFat',
    label:     'Grasso viscerale',
    unit:      '/12',
    direction: 'inverse',
  },
]

// ── Categorie profilo ─────────────────────────────────────────
export const PROFILE_CATEGORIES = Object.freeze([
  {
    id:       'tests_only',
    label:    'Solo Test',
    desc:     'Valutazione atletica con test fisici. Rank basato sulle performance.',
    color:    '#60a5fa',
    hasTests: true,
    hasBia:   false,
  },
  {
    id:       'bia_only',
    label:    'Solo BIA',
    desc:     'Analisi della composizione corporea con bioimpedenziometria.',
    color:    '#34d399',
    hasTests: false,
    hasBia:   true,
  },
  {
    id:       'complete',
    label:    'Completo',
    desc:     'Test atletici + BIA. Profilo completo con rank e composizione corporea.',
    color:    '#f59e0b',
    hasTests: true,
    hasBia:   true,
  },
])

export function getProfileCategory(id) {
  return PROFILE_CATEGORIES.find(c => c.id === id) ?? PROFILE_CATEGORIES[0]
}

// ── Range clinici massa grassa % ──────────────────────────────
export const FAT_MASS_RANGES = {
  M: {
    '18-39': { excellent: [0,8],  good: [8,15],  normal: [15,20], high: [20,25],  obese: [25,100] },
    '40-59': { excellent: [0,11], good: [11,18], normal: [18,22], high: [22,28],  obese: [28,100] },
    '60+':   { excellent: [0,13], good: [13,20], normal: [20,25], high: [25,30],  obese: [30,100] },
  },
  F: {
    '18-39': { excellent: [0,20], good: [20,25], normal: [25,30], high: [30,35],  obese: [35,100] },
    '40-59': { excellent: [0,23], good: [23,28], normal: [28,33], high: [33,38],  obese: [38,100] },
    '60+':   { excellent: [0,25], good: [25,30], normal: [30,35], high: [35,40],  obese: [40,100] },
  },
}

// ── Range acqua corporea % ────────────────────────────────────
export const WATER_RANGES = {
  M: { low: [0,55],  normal: [55,60], optimal: [60,65], high: [65,100] },
  F: { low: [0,50],  normal: [50,55], optimal: [55,60], high: [60,100] },
}

// ── Range grasso viscerale (scala 1-12) ───────────────────────
export const VISCERAL_RANGES = [
  { label: 'Ottimale', range: [1,4],   color: BIA_Q.excellent },
  { label: 'Normale',  range: [5,7],   color: BIA_Q.normal    },
  { label: 'Alto',     range: [8,10],  color: BIA_Q.high      },
  { label: 'Obeso',    range: [11,12], color: BIA_Q.bad       },
]

// ── Range BMI — OMS ───────────────────────────────────────────
export const BMI_RANGES = [
  { label: 'Sottopeso',  range: [0,18.5],  color: BIA_Q.low       },
  { label: 'Normale',    range: [18.5,25], color: BIA_Q.excellent },
  { label: 'Sovrappeso', range: [25,30],   color: BIA_Q.high      },
  { label: 'Obeso',      range: [30,100],  color: BIA_Q.bad       },
]

// ── XP per BIA ────────────────────────────────────────────────
// Stessa logica a tier del campionamento: 0/1/2-3/4 param chiave migliorati
export const XP_BIA = Object.freeze({
  FIRST_MEASUREMENT: 50,   // prima BIA in assoluto
  ALL:              100,   // tutti e 4 i parametri chiave migliorati
  MOST:              60,   // 2–3 parametri chiave migliorati
  PARTIAL:           30,   // 1 parametro chiave migliorato
  NONE:              10,   // 0 parametri chiave migliorati
})

// ── Parametri chiave per calcolo miglioramento ────────────────
// Un miglioramento conta se almeno 2 di questi migliorano
export const BIA_KEY_PARAMS = [
  'fatMassPercent',   // deve scendere
  'muscleMassKg',     // deve salire
  'waterPercent',     // deve salire
  'visceralFat',      // deve scendere
]

// ── Defaults nuova misurazione BIA ────────────────────────────
export const BIA_EMPTY = {
  fatMassPercent: '',
  muscleMassKg:   '',
  waterPercent:   '',
  boneMassKg:     '',
  bmi:            '',
  bmrKcal:        '',
  metabolicAge:   '',
  visceralFat:    '',
}
