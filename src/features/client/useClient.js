import { useState, useEffect } from 'react'
import { getClientById }       from '../../firebase/services/clients'

/**
 * Fetch del profilo cliente dal proprio clientId.
 *
 * @param {string} orgId
 * @param {string} clientId
 */
export function useClient(orgId, clientId) {
  const [client,  setClient]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!orgId || !clientId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    getClientById(orgId, clientId)
      .then(setClient)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId, clientId])

  return { client, loading, error }
}
