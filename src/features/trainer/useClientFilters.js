import { useState, useMemo } from 'react'
import {
  FILTER_ALL, SORT_KEYS,
  getAvailableSortKeys, resolveSortKey,
  getCategoriaOptions, getFasciaOptions, filterAndSortClients,
} from '../../utils/clientFilters'

/**
 * Gestisce filtri e ordinamento della lista clienti.
 * Separato da ClientsPage per mantenere il componente focalizzato sul render;
 * la logica pura è in utils/clientFilters.js.
 * @param {object[]} clients
 * @param {object[]} groups
 * @param {object}   capabilities — getModule(moduleType)
 */
export function useClientFilters(clients, groups, capabilities) {
  const [query,           setQuery]           = useState('')
  const [filterCategoria, setFilterCategoria] = useState(FILTER_ALL)
  const [filterFascia,    setFilterFascia]    = useState(FILTER_ALL)
  const [filterGroup,     setFilterGroup]     = useState(null)
  const [sortBy,          setSortBy]          = useState(SORT_KEYS.NAME)

  const sortKeys = useMemo(() => getAvailableSortKeys(capabilities), [capabilities])

  // Opzioni filtro: ruoli per soccer, categorie per PT, nessuna senza capability
  const categorie = useMemo(() => getCategoriaOptions(clients, capabilities), [clients, capabilities])

  // Opzioni fascia (solo soccer): 'tutti' | 'soccer' | 'soccer_youth' | 'soccer_junior'
  const fasce = useMemo(() => getFasciaOptions(clients, capabilities), [clients, capabilities])

  const filteredClients = useMemo(() =>
    filterAndSortClients(clients, groups, { query, filterCategoria, filterFascia, filterGroup, sortBy }, capabilities)
  , [clients, groups, filterGroup, filterCategoria, filterFascia, query, sortBy, capabilities])

  return {
    query,           onQueryChange:     setQuery,
    filterCategoria, onCategoriaChange: setFilterCategoria,
    filterFascia,    onFasciaChange:    setFilterFascia,
    filterGroup,     onGroupChange:     setFilterGroup,
    sortBy: resolveSortKey(sortBy, capabilities), onSortByChange: setSortBy,
    sortKeys,
    categorie,
    fasce,
    filteredClients,
  }
}
