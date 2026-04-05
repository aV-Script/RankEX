/**
 * Configurazione moduli di dominio RankEX.
 * Fonte di verità per terminologie, test fissi e comportamento per moduleType.
 */

// ── Moduli ────────────────────────────────────────────────────────────────────

export const MODULES = {
  PERSONAL_TRAINING: 'personal_training',
  SOCCER_ACADEMY:    'soccer_academy',
}

// ── Terminologie ──────────────────────────────────────────────────────────────
// Ogni variante mappa i concetti generici al termine di dominio corretto.

export const TERMINOLOGIES = {
  personal_training: {
    trainer:   'Trainer',
    client:    'Cliente',
    clients:   'Clienti',
    group:     'Gruppo',
    groups:    'Gruppi',
    session:   'Sessione',
    sessions:  'Sessioni',
  },
  gym: {
    trainer:  'Personal Trainer',
    client:   'Membro',
    clients:  'Membri',
    group:    'Classe',
    groups:   'Classi',
    session:  'Allenamento',
    sessions: 'Allenamenti',
  },
  soccer_academy: {
    trainer:  'Coach',
    client:   'Allievo',
    clients:  'Allievi',
    group:    'Squadra',
    groups:   'Squadre',
    session:  'Allenamento',
    sessions: 'Allenamenti',
  },
}

// ── Ruoli soccer (etichetta visiva) ───────────────────────────────────────────

export const PLAYER_ROLES = [
  { value: 'goalkeeper', label: 'Portiere' },
  { value: 'defender',   label: 'Difensore' },
  { value: 'midfielder', label: 'Centrocampista' },
  { value: 'forward',    label: 'Attaccante' },
]

// ── Test fissi soccer ─────────────────────────────────────────────────────────
// Per personal_training i test dipendono dalla categoria del cliente.

export const SOCCER_FIXED_TESTS = [
  'y_balance',
  'standing_long_jump',
  '505_cod_agility',
  'sprint_20m',
  'beep_test',
]

// ── Helper: ottieni terminologia ──────────────────────────────────────────────

/**
 * @param {string} moduleType — 'personal_training' | 'soccer_academy'
 * @param {string} [variant]  — 'gym' per GYM variant di personal_training
 * @returns {object} terminologia
 */
export function getTerminology(moduleType, variant) {
  if (variant && TERMINOLOGIES[variant]) return TERMINOLOGIES[variant]
  return TERMINOLOGIES[moduleType] ?? TERMINOLOGIES.personal_training
}

/**
 * @param {string} moduleType
 * @returns {object} modulo config
 */
export function getModule(moduleType) {
  return {
    moduleType,
    isSoccer:    moduleType === MODULES.SOCCER_ACADEMY,
    fixedTests:  moduleType === MODULES.SOCCER_ACADEMY ? SOCCER_FIXED_TESTS : null,
    hasCategories: moduleType !== MODULES.SOCCER_ACADEMY,
    hasBia:      moduleType !== MODULES.SOCCER_ACADEMY,
  }
}
