/**
 * Tab della dashboard cliente (vista trainer) e capability richieste per
 * mostrarle — senza JSX, così la regola di visibilità è testabile da sola.
 * Label e icone restano in ClientDashboardHeader.jsx.
 *
 * `capability`:    flag di getModule(moduleType) senza il quale la tab non esiste
 * `requiresTests`: in più, il profilo del cliente deve includere i test
 */
export const DASHBOARD_TABS = [
  { id: 'atleta' },
  { id: 'test',        capability: 'hasPercentileTests', requiresTests: true },
  { id: 'bia' },
  { id: 'allenamento' },
  { id: 'obiettivi',   capability: 'hasGoals' },
  { id: 'calendario' },
  { id: 'note' },
  { id: 'attivita',    capability: 'hasGamification' },
  { id: 'misure' },
  { id: 'wearable',    capability: 'hasWearable' },
  { id: 'trofei',      capability: 'hasGamification' },
]

/**
 * @param {object}  capabilities — getModule(moduleType)
 * @param {boolean} hasTests     — il profilo del cliente include i test
 * @returns {string[]} id delle tab visibili, nell'ordine della tab bar
 */
export function getVisibleTabIds(capabilities, hasTests) {
  return DASHBOARD_TABS
    .filter(tab => !tab.capability || capabilities[tab.capability])
    .filter(tab => !tab.requiresTests || hasTests)
    .map(tab => tab.id)
}
