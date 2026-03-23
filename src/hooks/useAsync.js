import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook generico per operazioni asincrone.
 * Gestisce loading, error e data in modo uniforme.
 *
 * @param {Function} fn        — funzione asincrona da eseguire
 * @param {Array}    deps      — dipendenze (come useEffect)
 * @param {boolean}  immediate — esegui subito al mount (default true)
 */
export function useAsync(fn, deps = [], immediate = true) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  // Ref per evitare setState su componente smontato
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn(...args)
      if (mounted.current) {
        setData(result)
        setLoading(false)
      }
      return result
    } catch (err) {
      if (mounted.current) {
        setError(err.message ?? 'Errore sconosciuto')
        setLoading(false)
      }
      throw err
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) execute()
  }, [execute]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, execute, setData }
}