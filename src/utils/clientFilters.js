import { calcBiaScore } from './bia'
import { calcAge }      from './validation'

/**
 * Filtri e ordinamento della lista clienti — funzioni pure usate da
 * features/trainer/useClientFilters.js. Ogni opzione dipende dalle capability
 * del modulo (getModule), mai da `!isSoccer` (ADR-007).
 */

export const FILTER_ALL = 'tutti'

export const SORT_KEYS = {
  NAME:  'name',
  RANK:  'rank',
  LEVEL: 'level',
}

const SORT_FNS = {
  [SORT_KEYS.NAME]:  (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
  [SORT_KEYS.LEVEL]: (a, b) => (b.level ?? 1) - (a.level ?? 1),
  [SORT_KEYS.RANK]:  (a, b) => getEffectiveScore(b) - getEffectiveScore(a),
}

/**
 * Ordinamenti disponibili: per rank solo con `hasRank`, per livello solo con
 * `hasGamification`. Il nome è sempre disponibile.
 * @param {object} capabilities — risultato di getModule(moduleType)
 * @returns {string[]}
 */
export function getAvailableSortKeys(capabilities = {}) {
  return [
    SORT_KEYS.NAME,
    capabilities.hasRank         && SORT_KEYS.RANK,
    capabilities.hasGamification && SORT_KEYS.LEVEL,
  ].filter(Boolean)
}

/**
 * Ordinamento effettivo: una chiave non disponibile nel modulo ricade sul nome.
 */
export function resolveSortKey(sortBy, capabilities = {}) {
  return getAvailableSortKeys(capabilities).includes(sortBy) ? sortBy : SORT_KEYS.NAME
}

/**
 * Campo cliente su cui filtra il filtro "Categoria/Ruolo": `ruolo` con
 * `hasPlayerRoles`, `categoria` con `hasCategories`, nessuno altrimenti.
 * @returns {'ruolo'|'categoria'|null}
 */
export function getCategoriaFilterField(capabilities = {}) {
  if (capabilities.hasPlayerRoles) return 'ruolo'
  if (capabilities.hasCategories)  return 'categoria'
  return null
}

/**
 * Opzioni del filtro Categoria/Ruolo — `[FILTER_ALL, ...valori presenti]`,
 * oppure solo `[FILTER_ALL]` se il modulo non ha né categorie né ruoli.
 */
export function getCategoriaOptions(clients, capabilities = {}) {
  const field = getCategoriaFilterField(capabilities)
  if (!field) return [FILTER_ALL]
  const values = new Set(clients.map(client => client[field]).filter(Boolean))
  return [FILTER_ALL, ...values]
}

/**
 * Opzioni del filtro Fascia — solo soccer (fasce d'età), e solo se tra i
 * clienti ci sono almeno due fasce diverse.
 */
export function getFasciaOptions(clients, capabilities = {}) {
  if (!capabilities.isSoccer) return []
  const values = new Set(clients.map(client => client.categoria).filter(Boolean))
  return values.size > 1 ? [FILTER_ALL, ...values] : []
}

/**
 * Lista filtrata e ordinata. I filtri non supportati dal modulo vengono
 * ignorati anche se valorizzati.
 * @param {object[]} clients
 * @param {object[]} groups
 * @param {{ query?, filterCategoria?, filterFascia?, filterGroup?, sortBy? }} filters
 * @param {object} capabilities
 */
export function filterAndSortClients(clients, groups, filters, capabilities = {}) {
  const {
    query = '', filterCategoria = FILTER_ALL, filterFascia = FILTER_ALL,
    filterGroup = null, sortBy = SORT_KEYS.NAME,
  } = filters
  let list = [...clients]

  if (filterGroup) {
    const group = groups.find(candidate => candidate.id === filterGroup)
    if (group) list = list.filter(client => group.clientIds.includes(client.id))
  }

  const categoriaField = getCategoriaFilterField(capabilities)
  if (categoriaField && filterCategoria !== FILTER_ALL) {
    list = list.filter(client => client[categoriaField] === filterCategoria)
  }

  if (capabilities.isSoccer && filterFascia !== FILTER_ALL) {
    list = list.filter(client => client.categoria === filterFascia)
  }

  const trimmedQuery = query.trim().toLowerCase()
  if (trimmedQuery) {
    list = list.filter(client => client.name?.toLowerCase().includes(trimmedQuery))
  }

  return list.sort(SORT_FNS[resolveSortKey(sortBy, capabilities)])
}

/**
 * Score effettivo per ordinamento rank — dipende dal profileType:
 * - tests_only → media test
 * - bia_only   → BIA score
 * - complete   → media dei due score
 */
function getEffectiveScore(client) {
  const profileType = client.profileType ?? 'tests_only'
  const testScore   = client.media ?? 0
  const biaScore    = calcBiaScore(client.lastBia, client.sesso, calcAge(client.dataNascita))

  if (profileType === 'bia_only')  return biaScore
  if (profileType === 'complete')  return Math.round((testScore + biaScore) / 2)
  return testScore
}
