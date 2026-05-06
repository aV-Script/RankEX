import { useState, useEffect, useCallback }              from 'react'
import { useTrainerState, useTrainerDispatch, ACTIONS }  from '../context/TrainerContext'
import {
  enableWearable,
  disableWearable,
  linkGoogleFit,
  unlinkWearable,
  resolveGoogleFitRedirect,
  fetchAndSaveWearableData,
} from '../firebase/services/wearable'
import { useToast } from './useToast'

/**
 * Hook per il trainer — gestione wearable di un cliente.
 * Usa TrainerContext per aggiornare lo stato ottimisticamente.
 */
export function useWearable(client, orgId) {
  const dispatch       = useTrainerDispatch()
  const { userRole }   = useTrainerState()
  const toast          = useToast()
  const [loading, setLoading] = useState(false)

  const readonly = userRole === 'staff_readonly'

  const patchClient = useCallback((patch) => {
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...patch } })
  }, [dispatch, client])

  const handleEnable = useCallback(async () => {
    if (readonly) return
    const snapshot = { wearableEnabled: client.wearableEnabled }
    patchClient({ wearableEnabled: true })
    try {
      await enableWearable(orgId, client.id)
    } catch {
      patchClient(snapshot)
      toast.error('Impossibile abilitare Wearable')
    }
  }, [readonly, orgId, client, patchClient, toast])

  const handleDisable = useCallback(async () => {
    if (readonly) return
    const snapshot = { wearableEnabled: client.wearableEnabled, wearable: client.wearable }
    patchClient({ wearableEnabled: false, wearable: undefined })
    try {
      await disableWearable(orgId, client.id)
    } catch {
      patchClient(snapshot)
      toast.error('Impossibile disabilitare Wearable')
    }
  }, [readonly, orgId, client, patchClient, toast])

  const handleSync = useCallback(async () => {
    const accessToken = client.wearable?.accessToken
    if (!accessToken) return
    setLoading(true)
    try {
      const lastData = await fetchAndSaveWearableData(orgId, client.id, accessToken)
      patchClient({ wearable: { ...client.wearable, lastData } })
      toast.success('Dati aggiornati')
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        toast.error('Token scaduto — il cliente deve ricollegare Google Fit')
      } else {
        toast.error('Errore durante la sincronizzazione')
      }
    } finally {
      setLoading(false)
    }
  }, [orgId, client, patchClient, toast])

  return { loading, readonly, handleEnable, handleDisable, handleSync }
}

/**
 * Hook per il cliente — collega/scollega Google Fit dal proprio profilo.
 * Usa il flusso redirect (compatibile con Edge e browser con tracking prevention).
 * Al mount risolve automaticamente un redirect OAuth pendente.
 */
export function useClientWearable(orgId, clientId, initialWearable) {
  const toast = useToast()
  const [wearable, setWearable] = useState(initialWearable ?? null)
  const [loading,  setLoading]  = useState(false)

  // Risolve il redirect OAuth al rientro da Google
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    resolveGoogleFitRedirect()
      .then(lastData => {
        if (cancelled || !lastData) return
        setWearable(prev => ({
          provider:    'google_fit',
          linkedAt:    prev?.linkedAt ?? { toDate: () => new Date() },
          lastSync:    { toDate: () => new Date() },
          accessToken: prev?.accessToken ?? '',
          lastData,
        }))
        toast.success('Google Fit collegato')
      })
      .catch((err) => {
        if (!cancelled) toast.error('Errore durante il collegamento')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLink = useCallback(async () => {
    setLoading(true)
    try {
      await linkGoogleFit(orgId, clientId)
      // La pagina naviga verso Google — il codice sotto non viene eseguito
    } catch (err) {
      toast.error('Errore durante il collegamento')
      setLoading(false)
    }
  }, [orgId, clientId, toast])

  const handleSync = useCallback(async () => {
    const accessToken = wearable?.accessToken
    if (!accessToken) return
    setLoading(true)
    try {
      const lastData = await fetchAndSaveWearableData(orgId, clientId, accessToken)
      setWearable(prev => ({ ...prev, lastData }))
      toast.success('Dati aggiornati')
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        toast.error('Sessione scaduta — ricollega Google Fit')
      } else {
        toast.error('Errore durante la sincronizzazione')
      }
    } finally {
      setLoading(false)
    }
  }, [orgId, clientId, wearable?.accessToken, toast])

  const handleUnlink = useCallback(async () => {
    setLoading(true)
    try {
      await unlinkWearable(orgId, clientId)
      setWearable(null)
      toast.success('Google Fit scollegato')
    } catch {
      toast.error('Errore durante lo scollegamento')
    } finally {
      setLoading(false)
    }
  }, [orgId, clientId, toast])

  return { wearable, loading, handleLink, handleSync, handleUnlink }
}
