import { useState, useEffect, useCallback } from 'react'
import { useTrainerDispatch, ACTIONS }      from '../context/TrainerContext'
import { getClients, getClientById } from '../firebase/services/clients'
import { buildCampionamentoUpdate, buildXPUpdate } from '../utils/gamification'
import { createClientUseCase }      from '../usecases/createClientUseCase'
import { deleteClientUseCase }      from '../usecases/deleteClientUseCase'
import { saveCampionamentoUseCase } from '../usecases/saveCampionamentoUseCase'
import { saveXPUseCase }            from '../usecases/saveXPUseCase'
import { useToast }                 from './useToast'
import { getFirebaseErrorMessage }  from '../utils/firebaseErrors'
import { auditLog, AUDIT_ACTIONS }  from '../utils/auditLog'

/**
 * @param {string} orgId    — ID organizzazione (subcollection path)
 * @param {string} [userId] — UID del trainer che crea i clienti (opzionale)
 */
export function useClients(orgId, userId) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const dispatch              = useTrainerDispatch()
  const { success: toastSuccess, error: toastError } = useToast()

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchClients = useCallback(() => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    getClients(orgId)
      .then(data => setClients(data))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [orgId])

  useEffect(() => { fetchClients() }, [fetchClients])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateLocal = useCallback((id, updater) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updater } : c))
  }, [])

  const removeLocal = useCallback((id) => {
    setClients(prev => prev.filter(c => c.id !== id))
  }, [])

  // ── Add client ─────────────────────────────────────────────────────────────
  const handleAddClient = useCallback(async (formData) => {
    try {
      const newClient = await createClientUseCase(orgId, userId ?? orgId, formData)
      setClients(prev => [...prev, newClient])
      toastSuccess('Cliente creato')
      return newClient
    } catch (err) {
      toastError(getFirebaseErrorMessage(err, 'Impossibile creare il cliente'))
      throw err
    }
  }, [orgId, userId, toastSuccess, toastError])

  // ── Campionamento — ottimistico con rollback ───────────────────────────────
  const handleCampionamento = useCallback(async (client, newStats, testValues) => {
    const { update } = buildCampionamentoUpdate(client, newStats, testValues)
    const snapshot   = client

    updateLocal(client.id, update)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await saveCampionamentoUseCase(orgId, client, update, testValues)
      toastSuccess('Campionamento salvato')
    } catch (err) {
      updateLocal(client.id, snapshot)
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
      toastError(getFirebaseErrorMessage(err, 'Impossibile salvare il campionamento'))
      // Rilanciato: chi ha aperto il campionamento lo tiene aperto con i valori
      // inseriti, invece di chiuderlo come se il salvataggio fosse riuscito.
      throw err
    }

    // Percentili, rank e XP li calcola il server: l'update locale è una stima.
    // Si rilegge il cliente per mostrare i valori realmente salvati.
    try {
      const saved = await getClientById(orgId, client.id)
      if (saved) {
        updateLocal(client.id, saved)
        dispatch({ type: ACTIONS.SELECT_CLIENT, payload: saved })
      }
    } catch {
      // Non bloccante: il salvataggio è riuscito, resta la stima locale fino al refresh
    }
  }, [orgId, dispatch, updateLocal, toastSuccess, toastError])

  // ── Add XP — ottimistico con rollback ─────────────────────────────────────
  const handleAddXP = useCallback(async (client, xpToAdd, note) => {
    const { update } = buildXPUpdate(client, xpToAdd, note)
    const snapshot   = client

    updateLocal(client.id, update)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await saveXPUseCase(orgId, client, xpToAdd, note, update)
    } catch (err) {
      updateLocal(client.id, snapshot)
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
      toastError(getFirebaseErrorMessage(err, 'Impossibile assegnare gli XP'))
      throw err
    }
  }, [orgId, dispatch, updateLocal, toastError])

  // ── Delete client — ottimistico con rollback ──────────────────────────────
  const handleDeleteClient = useCallback(async (clientId) => {
    const snapshot = clients.find(c => c.id === clientId)

    removeLocal(clientId)
    dispatch({ type: ACTIONS.DESELECT_CLIENT })

    try {
      await deleteClientUseCase(orgId, clientId)
      auditLog(AUDIT_ACTIONS.CLIENT_DELETED, { clientId, clientName: snapshot?.name, orgId })
      toastSuccess('Cliente eliminato')
    } catch (err) {
      if (snapshot) setClients(prev => [...prev, snapshot])
      toastError(getFirebaseErrorMessage(err, 'Impossibile eliminare il cliente'))
      throw err
    }
  }, [orgId, clients, dispatch, removeLocal, toastSuccess, toastError])

  return {
    clients,
    isLoading: loading,
    fetchError: error,
    fetchClients,
    handleAddClient,
    handleCampionamento,
    handleAddXP,
    handleDeleteClient,
  }
}
