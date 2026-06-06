import { useState, useEffect } from 'react'
import { onSnapshot, doc }     from 'firebase/firestore'
import { db }                  from '../../firebase/services/db'
import { clientsPath }         from '../../firebase/paths'

export function useClient(orgId, clientId) {
  const [client,  setClient]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!orgId || !clientId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const ref = doc(db, clientsPath(orgId), clientId)
    const unsub = onSnapshot(
      ref,
      snap => {
        setClient(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      err => {
        setError(err.message)
        setLoading(false)
      }
    )
    return unsub
  }, [orgId, clientId])

  return { client, loading, error }
}
