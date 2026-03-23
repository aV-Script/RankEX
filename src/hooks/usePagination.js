import { useState, useMemo, useEffect } from 'react'

/**
 * Hook generico per la paginazione client-side.
 * Riusabile per qualsiasi lista di elementi.
 *
 * @param {Array}  items    — lista completa degli elementi
 * @param {number} pageSize — elementi per pagina (default 12)
 */
export function usePagination(items, pageSize = 12) {
  const [page, setPage] = useState(1)

  // Resetta alla prima pagina quando cambia la lista
  useEffect(() => {
    setPage(1)
  }, [items.length])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const goTo = (n)  => setPage(Math.max(1, Math.min(n, totalPages)))
  const next  = ()  => goTo(page + 1)
  const prev  = ()  => goTo(page - 1)

  return {
    page,
    totalPages,
    paginatedItems,
    goTo,
    next,
    prev,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    from:    (page - 1) * pageSize + 1,
    to:      Math.min(page * pageSize, items.length),
    total:   items.length,
  }
}