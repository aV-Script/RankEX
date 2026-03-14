import { useEffect, useCallback } from 'react'
import { useClientState, useClientDispatch, ACTIONS } from '../context/ClientContext'
import { getClients, addClient, updateClient } from '../firebase/clients'
import { createClientAccount } from '../firebase/auth'
import { addNotification } from '../firebase/notifications'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import app from '../firebase/config'
import { buildNewClient, buildCampionamentoUpdate, buildXPUpdate } from '../utils/gamification'
import { NEW_CLIENT_DEFAULTS } from '../constants'

const db   = getFirestore(app)
const auth = getAuth(app)

export function useClients(trainerId) {
  const state    = useClientState()
  const dispatch = useClientDispatch()

  useEffect(() => {
    if (!trainerId) return
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    getClients(trainerId)
      .then(clients => dispatch({ type: ACTIONS.SET_CLIENTS, payload: clients }))
      .catch(err   => dispatch({ type: ACTIONS.SET_ERROR,   payload: err.message }))
  }, [trainerId])

  const handleAddClient = useCallback(async (formData) => {
    const { email, password, ...rest } = formData

    // 1. Crea account Firebase Auth per il cliente
    // Salviamo il trainer loggato per re-autenticarci dopo
    const trainerUser = auth.currentUser
    let clientUid
    try {
      clientUid = await createClientAccount(email, password)
    } finally {
      // Non serve re-login: createClientAccount non fa logout del trainer
      // perché usiamo un approccio diverso (vedi services.js)
    }

    // 2. Crea documento cliente su Firestore
    const data = buildNewClient(trainerId, rest, NEW_CLIENT_DEFAULTS)
    const ref  = await addClient(trainerId, { ...data, email, clientAuthUid: clientUid })

    // 3. Salva profilo utente con ruolo 'client'
    await setDoc(doc(db, 'users', clientUid), {
      role:               'client',
      clientId:           ref.id,
      trainerId,
      mustChangePassword: true,
    })

    dispatch({ type: ACTIONS.ADD_CLIENT, payload: { id: ref.id, ...data, email, clientAuthUid: clientUid } })
  }, [trainerId])

  const handleCampionamento = useCallback(async (client, newStats, testValues) => {
    const { update } = buildCampionamentoUpdate(client, newStats, testValues)
    dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: { id: client.id, ...update } })
    try {
      await updateClient(client.id, update)
      // Notifica al cliente
      if (client.clientAuthUid) {
        await addNotification({
          clientId: client.id,
          message:  `Il tuo trainer ha aggiornato i tuoi parametri — nuovo rank: ${update.rank}`,
          date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type:     'campionamento',
        })
      }
    } catch { dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: client }) }
  }, [])

  const handleAddXP = useCallback(async (client, xpToAdd, note) => {
    const { update } = buildXPUpdate(client, xpToAdd, note)
    dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: { id: client.id, ...update } })
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
    } catch { dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: client }) }
  }, [])

  const updateLocalClient = useCallback((update) => {
    if (state.selectedClient?.id) {
      dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: { id: state.selectedClient.id, ...update } })
    }
  }, [state.selectedClient?.id])

  const selectClient   = useCallback(client => dispatch({ type: ACTIONS.SELECT_CLIENT,   payload: client }), [])
  const deselectClient = useCallback(()       => dispatch({ type: ACTIONS.DESELECT_CLIENT }), [])

  return { ...state, handleAddClient, handleCampionamento, handleAddXP, updateLocalClient, selectClient, deselectClient }
}
