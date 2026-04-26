import { useState, useMemo }  from 'react'
import { calcBiaScore }        from '../../utils/bia'

/**
 * Gestisce filtri e ordinamento della lista clienti.
 * Separato da ClientsPage per mantenere il componente focalizzato sul render.
 */

/**
 * Score effettivo per ordinamento rank — dipende dal profileType:
 * - tests_only → media test
 * - bia_only   → BIA score
 * - complete   → media dei due score
 */
function getEffectiveScore(client) {
  const profileType = client.profileType ?? 'tests_only'
  const testScore   = client.media ?? 0
  const biaScore    = calcBiaScore(client.lastBia, client.sesso, client.eta)

  if (profileType === 'bia_only')  return biaScore
  if (profileType === 'complete')  return Math.round((testScore + biaScore) / 2)
  return testScore
}

const SORT_FNS = {
  name:  (a, b) => a.name.localeCompare(b.name),
  level: (a, b) => (b.level ?? 1) - (a.level ?? 1),
  rank:  (a, b) => getEffectiveScore(b) - getEffectiveScore(a),
}

export function useClientFilters(clients, groups, isSoccer = false) {
  const [query,           setQuery]           = useState('')
  const [filterCategoria, setFilterCategoria] = useState('tutti')
  const [filterFascia,    setFilterFascia]    = useState('tutti')
  const [filterGroup,     setFilterGroup]     = useState(null)
  const [sortBy,          setSortBy]          = useState('name')

  // Opzioni filtro: ruoli per soccer, categorie per PT
  const categorie = useMemo(() => {
    const values = clients.map(c => isSoccer ? c.ruolo : c.categoria)
    const set = new Set(values.filter(Boolean))
    return ['tutti', ...Array.from(set)]
  }, [clients, isSoccer])

  // Opzioni fascia (solo soccer): 'tutti' | 'soccer' | 'soccer_youth'
  const fasce = useMemo(() => {
    if (!isSoccer) return []
    const values = clients.map(c => c.categoria).filter(Boolean)
    const set = new Set(values)
    return set.size > 1 ? ['tutti', ...Array.from(set)] : []
  }, [clients, isSoccer])

  // Lista filtrata e ordinata
  const filteredClients = useMemo(() => {
    let list = [...clients]

    if (filterGroup) {
      const grp = groups.find(g => g.id === filterGroup)
      if (grp) list = list.filter(c => grp.clientIds.includes(c.id))
    }

    if (filterCategoria !== 'tutti') {
      list = list.filter(c =>
        isSoccer ? c.ruolo === filterCategoria : c.categoria === filterCategoria
      )
    }

    if (isSoccer && filterFascia !== 'tutti') {
      list = list.filter(c => c.categoria === filterFascia)
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(c => c.name?.toLowerCase().includes(q))
    }

    return list.sort(SORT_FNS[sortBy] ?? SORT_FNS.name)
  }, [clients, groups, filterGroup, filterCategoria, filterFascia, query, sortBy, isSoccer])

  return {
    query,           onQueryChange:     setQuery,
    filterCategoria, onCategoriaChange: setFilterCategoria,
    filterFascia,    onFasciaChange:    setFilterFascia,
    filterGroup,     onGroupChange:     setFilterGroup,
    sortBy,          onSortByChange:    setSortBy,
    categorie,
    fasce,
    filteredClients,
  }
}