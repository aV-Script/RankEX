import { useState, useEffect, useCallback } from 'react'
import { useTrainerDispatch, ACTIONS }       from '../context/TrainerContext'
import { getClients, addClient, updateClient, deleteClient } from '../firebase/services/clients'
import { createClientAccount }   from '../firebase/services/auth'
import { addNotification }       from '../firebase/services/notifications'
import { setDoc, doc }           from 'firebase/firestore'
import { db }                    from '../firebase/services/db'
import { buildNewClient, buildCampionamentoUpdate, buildXPUpdate } from '../utils/gamification'
import { NEW_CLIENT_DEFAULTS }   from '../constants'
import { useToast }              from './useToast'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'

export function useClients(trainerId) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const dispatch              = useTrainerDispatch()
  const toast                 = useToast()

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!trainerId) return
    setLoading(true)
    setError(null)
    getClients(trainerId)
      .then(data => setClients(data))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [trainerId])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateLocal = useCallback((id, updater) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updater } : c))
  }, [])

  const removeLocal = useCallback((id) => {
    setClients(prev => prev.filter(c => c.id !== id))
  }, [])

  // ── Add client — non ottimistico per natura (richiede uid Firebase) ────────
  const handleAddClient = useCallback(async (formData) => {
    const { email, password, ...rest } = formData
    try {
      const clientUid = await createClientAccount(email, password)
      const data      = buildNewClient(trainerId, rest, NEW_CLIENT_DEFAULTS)
      const ref       = await addClient(trainerId, { ...data, email, clientAuthUid: clientUid })
      await setDoc(doc(db, 'users', clientUid), {
        role:               'client',
        clientId:           ref.id,
        trainerId,
        mustChangePassword: true,
      })
      const newClient = { id: ref.id, ...data, email, clientAuthUid: clientUid }
      setClients(prev => [...prev, newClient])
      toast.success('Cliente creato')
      return newClient
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err, 'Impossibile creare il cliente'))
      throw err
    }
  }, [trainerId, toast])

  // ── Campionamento — ottimistico con rollback ───────────────────────────────
  const handleCampionamento = useCallback(async (client, newStats, testValues) => {
    const { update } = buildCampionamentoUpdate(client, newStats, testValues)
    const snapshot   = client

    updateLocal(client.id, update)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await updateClient(client.id, update)
      if (client.clientAuthUid) {
        await addNotification({
          clientId: client.id,
          message:  `Il tuo trainer ha aggiornato i tuoi parametri — nuovo rank: ${update.rank}`,
          date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type:     'campionamento',
        })
      }
      toast.success('Campionamento salvato')
    } catch {
      updateLocal(client.id, snapshot)
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
      toast.error('Impossibile salvare il campionamento')
    }
  }, [dispatch, updateLocal, toast])

  // ── Add XP — ottimistico con rollback ─────────────────────────────────────
  const handleAddXP = useCallback(async (client, xpToAdd, note) => {
    const { update } = buildXPUpdate(client, xpToAdd, note)
    const snapshot   = client

    updateLocal(client.id, update)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await updateClient(client.id, update)
      if (client.clientAuthUid) {
        await addNotification({
          clientId: client.id,
          message:  `Hai guadagnato ${xpToAdd} XP — ${note || 'aggiunto dal trainer'}!`,
          date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type:     'xp',
        })
      }
    } catch {
      updateLocal(client.id, snapshot)
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
    }
  }, [dispatch, updateLocal])

  // ── Delete client — ottimistico con rollback ──────────────────────────────
  const handleDeleteClient = useCallback(async (clientId) => {
    const snapshot = clients.find(c => c.id === clientId)

    removeLocal(clientId)
    dispatch({ type: ACTIONS.DESELECT_CLIENT })

    try {
      await deleteClient(clientId)
      toast.success('Cliente eliminato')
    } catch {
      if (snapshot) setClients(prev => [...prev, snapshot])
      toast.error('Impossibile eliminare il cliente')
    }
  }, [clients, dispatch, removeLocal, toast])

  return {
    clients,
    loading,
    error,
    handleAddClient,
    handleCampionamento,
    handleAddXP,
    handleDeleteClient,
  }
}