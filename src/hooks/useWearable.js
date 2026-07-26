import { useState, useCallback }                        from 'react'
import { useTrainerState, useTrainerDispatch, ACTIONS }  from '../context/TrainerContext'
import {
  enableWearable,
  disableWearable,
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
