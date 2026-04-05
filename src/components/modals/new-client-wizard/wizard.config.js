/**
 * Configurazione degli step del wizard.
 * BIA e test vengono inseriti dopo la creazione del cliente, non nel wizard.
 *
 * type:
 *   'anagrafica'   — dati anagrafici
 *   'profileType'  — selezione tipologia profilo
 *   'categoria'    — selezione categoria test (solo se profilo include test)
 *   'account'      — credenziali cliente
 */

const BASE_STEPS = [
  { type: 'anagrafica',  title: 'Dati anagrafici' },
  { type: 'profileType', title: 'Tipologia profilo' },
]

const CATEGORIA_STEP = [
  { type: 'categoria', title: 'Categoria test' },
]

const TAIL_STEPS = [
  { type: 'account', title: 'Account cliente' },
]

const RUOLO_STEP = [
  { type: 'ruolo', title: 'Ruolo giocatore' },
]

const SOCCER_STEPS = [
  { type: 'anagrafica', title: 'Dati anagrafici' },
  ...RUOLO_STEP,
  ...TAIL_STEPS,
]

export function getWizardSteps(profileType = 'tests_only', isSoccer = false) {
  if (isSoccer)               return SOCCER_STEPS
  if (profileType === 'bia_only') return [...BASE_STEPS, ...TAIL_STEPS]
  return                               [...BASE_STEPS, ...CATEGORIA_STEP, ...TAIL_STEPS]
}

export const TOTAL_STEPS_MAP = {
  tests_only: BASE_STEPS.length + CATEGORIA_STEP.length + TAIL_STEPS.length,
  bia_only:   BASE_STEPS.length + TAIL_STEPS.length,
  complete:   BASE_STEPS.length + CATEGORIA_STEP.length + TAIL_STEPS.length,
  soccer:     SOCCER_STEPS.length,
}

// Compatibilità con codice esistente
export const WIZARD_STEPS = getWizardSteps('tests_only')
export const TOTAL_STEPS  = TOTAL_STEPS_MAP.tests_only
