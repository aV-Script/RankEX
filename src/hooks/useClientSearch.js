import { useState, useMemo } from 'react'

/**
 * Hook per la ricerca/filtro clienti.
 * Usa useMemo per evitare ricalcoli inutili ad ogni render.
 */
export function useClientSearch(clients) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c => c.name?.toLowerCase().includes(q))
  }, [clients, query])

  return { query, setQuery, filtered }
}
