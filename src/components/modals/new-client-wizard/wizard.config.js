/**
 * Configurazione degli step del wizard.
 * Aggiungere uno step = aggiungere una voce qui.
 *
 * type:
 *   'anagrafica' — dati anagrafici
 *   'categoria'  — selezione categoria
 *   'test'       — inserimento test (index = indice del test nella categoria)
 *   'settings'   — impostazioni allenamento
 *   'account'    — credenziali cliente
 */
export const WIZARD_STEPS = [
  { type: 'anagrafica', title: 'Dati anagrafici' },
  { type: 'categoria',  title: 'Categoria' },
  { type: 'test',       title: null, index: 0 }, 
  { type: 'test',       title: null, index: 1 },
  { type: 'test',       title: null, index: 2 },
  { type: 'test',       title: null, index: 3 },
  { type: 'test',       title: null, index: 4 },
  { type: 'settings',  title: 'Impostazioni allenamento' },
  { type: 'account',   title: 'Account cliente' },
]

export const TOTAL_STEPS = WIZARD_STEPS.length