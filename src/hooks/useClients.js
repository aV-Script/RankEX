import { useState, useEffect, useCallback } from 'react'
import { useTrainerDispatch, ACTIONS }      from '../context/TrainerContext'
import { getClients, deleteClient }  from '../firebase/services/clients'
import { buildCampionamentoUpdate, buildXPUpdate } from '../utils/gamification'
import { createClientUseCase }      from '../usecases/createClientUseCase'
import { saveCampionamentoUseCase } from '../usecases/saveCampionamentoUseCase'
import { saveXPUseCase }            from '../usecases/saveXPUseCase'
import { addNotification }          from '../firebase/services/notifications'
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
  const toast                 = useToast()

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
      toast.success('Cliente creato')
      return newClient
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err, 'Impossibile creare il cliente'))
      throw err
    }
  }, [orgId, userId, toast])

  // ── Campionamento — ottimistico con rollback ───────────────────────────────
  const handleCampionamento = useCallback(async (client, newStats, testValues) => {
    const { update } = buildCampionamentoUpdate(client, newStats, testValues)
    const snapshot   = client

    updateLocal(client.id, update)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await saveCampionamentoUseCase(orgId, client, update)
      toast.success('Campionamento salvato')

      const isFirst      = !client.campionamenti?.length
      const rankChanged  = !isFirst && update.rank !== client.rank
      const today        = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
      const xpGain       = update.log?.[0]?.xp ?? 0
      const message      = isFirst
        ? 'Primo campionamento registrato!'
        : rankChanged
          ? `Campionamento registrato — rank aggiornato: ${client.rank} → ${update.rank}`
          : `Campionamento registrato (+${xpGain} XP)`
      addNotification(orgId, {
        clientId: client.id,
        message,
        date:     today,
        type:     rankChanged ? 'rank' : 'xp',
      }).catch(() => {})
    } catch {
      updateLocal(client.id, snapshot)
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
      toast.error('Impossibile salvare il campionamento')
    }
  }, [orgId, dispatch, updateLocal, toast])

  // ── Add XP — ottimistico con rollback ─────────────────────────────────────
  const handleAddXP = useCallback(async (client, xpToAdd, note) => {
    const { update } = buildXPUpdate(client, xpToAdd, note)
    const snapshot   = client

    updateLocal(client.id, update)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await saveXPUseCase(orgId, client, xpToAdd, note, update)
    } catch {
      updateLocal(client.id, snapshot)
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
    }
  }, [orgId, dispatch, updateLocal])

  // ── Delete client — ottimistico con rollback ──────────────────────────────
  const handleDeleteClient = useCallback(async (clientId) => {
    const snapshot = clients.find(c => c.id === clientId)

    removeLocal(clientId)
    dispatch({ type: ACTIONS.DESELECT_CLIENT })

    try {
      await deleteClient(orgId, clientId)
      auditLog(AUDIT_ACTIONS.CLIENT_DELETED, { clientId, clientName: snapshot?.name, orgId })
      toast.success('Cliente eliminato')
    } catch {
      if (snapshot) setClients(prev => [...prev, snapshot])
      toast.error('Impossibile eliminare il cliente')
    }
  }, [orgId, clients, dispatch, removeLocal, toast])

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
