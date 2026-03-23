import { useState, useEffect } from 'react'
import { getClientById }       from '../../firebase/services/clients'

/**
 * Fetch del profilo cliente dal proprio clientId.
 * Ricarica automaticamente se cambia clientId.
 */
export function useClient(clientId) {
  const [client,  setClient]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    setError(null)
    getClientById(clientId)
      .then(setClient)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [clientId])

  return { client, loading, error }
}