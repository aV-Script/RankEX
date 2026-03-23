import { useState, useMemo } from 'react'

/**
 * Gestisce filtri e ordinamento della lista clienti.
 * Separato da ClientsPage per mantenere il componente focalizzato sul render.
 */

const SORT_FNS = {
  name:  (a, b) => a.name.localeCompare(b.name),
  level: (a, b) => (b.level ?? 1) - (a.level ?? 1),
  rank:  (a, b) => (b.media ?? 0) - (a.media ?? 0),
}

export function useClientFilters(clients, groups) {
  const [query,           setQuery]           = useState('')
  const [filterCategoria, setFilterCategoria] = useState('tutti')
  const [filterGroup,     setFilterGroup]     = useState(null)
  const [sortBy,          setSortBy]          = useState('name')

  // Categorie uniche presenti tra i clienti
  const categorie = useMemo(() => {
    const set = new Set(clients.map(c => c.categoria).filter(Boolean))
    return ['tutti', ...Array.from(set)]
  }, [clients])

  // Lista filtrata e ordinata
  const displayed = useMemo(() => {
    let list = [...clients]

    if (filterGroup) {
      const grp = groups.find(g => g.id === filterGroup)
      if (grp) list = list.filter(c => grp.clientIds.includes(c.id))
    }

    if (filterCategoria !== 'tutti') {
      list = list.filter(c => c.categoria === filterCategoria)
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(c => c.name?.toLowerCase().includes(q))
    }

    return list.sort(SORT_FNS[sortBy] ?? SORT_FNS.name)
  }, [clients, groups, filterGroup, filterCategoria, query, sortBy])

  return {
    query,           setQuery,
    filterCategoria, setFilterCategoria,
    filterGroup,     setFilterGroup,
    sortBy,          setSortBy,
    categorie,
    displayed,
  }
}