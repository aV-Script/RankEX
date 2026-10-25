// Capability per modulo — sottoinsieme speculare di src/config/modules.config.js
// (MODULE_CAPABILITIES). Qui solo i flag che servono lato server (ADR-007 §5):
// non tutti sono già letti da una callable — hasAssessments e hasClientLogin
// entrano con STORY-032/033, hasBia/hasProfileTypes non sono ancora applicati
// (vedi TD-007).
// Se cambi un flag presente in entrambe le copie, aggiorna tutte e due: il test di
// parità in src/__tests__/parity/clientServerParity.test.js le confronta.
// Funzioni pure, nessuna dipendenza da firebase: la lettura dell'org e i rifiuti
// stanno in orgModule.js.

export const MODULES = {
  PERSONAL_TRAINING: 'personal_training',
  SOCCER_ACADEMY:    'soccer_academy',
  LIPEDEMA:          'lipedema',
}

export const SERVER_CAPABILITY_KEYS = [
  'hasGamification',
  'hasPercentileTests',
  'hasAssessments',
  'hasBia',
  'hasGoals',
  'hasProfileTypes',
  'hasClientLogin',
]

export const MODULE_CAPABILITIES = {
  [MODULES.PERSONAL_TRAINING]: {
    hasGamification: true,  hasPercentileTests: true,  hasAssessments: false, hasBia: true,
    hasGoals: true,  hasProfileTypes: true,  hasClientLogin: true,
  },
  [MODULES.SOCCER_ACADEMY]: {
    hasGamification: true,  hasPercentileTests: true,  hasAssessments: false, hasBia: false,
    hasGoals: true,  hasProfileTypes: false, hasClientLogin: true,
  },
  [MODULES.LIPEDEMA]: {
    hasGamification: false, hasPercentileTests: false, hasAssessments: true,  hasBia: true,
    hasGoals: false, hasProfileTypes: false, hasClientLogin: false,
  },
}

/**
 * Capability del modulo di un'org.
 * `moduleType` assente (null/undefined) = org legacy PT, creata prima del campo.
 * Un valore non nullo e sconosciuto restituisce `null`: è un dato corrotto, il
 * chiamante deve rifiutare invece di degradare su PT (ADR-007 §5).
 * @param {string|null|undefined} moduleType
 * @returns {object|null}
 */
export function resolveModuleCapabilities(moduleType) {
  if (moduleType === null || moduleType === undefined) {
    return MODULE_CAPABILITIES[MODULES.PERSONAL_TRAINING]
  }
  return MODULE_CAPABILITIES[moduleType] ?? null
}
