import { useEffect, useCallback } from 'react'
import { useClientState, useClientDispatch, ACTIONS } from '../context/ClientContext'
import { getClients, addClient, updateClient, addSession } from '../firebase/services'
import { buildNewClient, buildCampionamentoUpdate, buildXPUpdate } from '../utils/gamification'
import { NEW_CLIENT_DEFAULTS } from '../constants'

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
    const data = buildNewClient(trainerId, formData, NEW_CLIENT_DEFAULTS)
    try {
      const ref = await addClient(trainerId, data)
      dispatch({ type: ACTIONS.ADD_CLIENT, payload: { id: ref.id, ...data } })
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message })
      throw err
    }
  }, [trainerId])

  // Nuovo campionamento — ricalcola le statistiche dai test
  const handleCampionamento = useCallback(async (client, newStats, testValues, note) => {
    const { update } = buildCampionamentoUpdate(client, newStats, testValues, note)
    try {
      dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: { id: client.id, ...update } })
      await Promise.all([
        updateClient(client.id, update),
        addSession(client.id, { action: update.log[0].action, campionamento: { stats: newStats, tests: testValues } }),
      ])
    } catch (err) {
      dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: client })
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Errore durante il salvataggio.' })
      throw err
    }
  }, [])

  // Aggiunta XP manuale
  const handleAddXP = useCallback(async (client, xpToAdd, note) => {
    const { update } = buildXPUpdate(client, xpToAdd, note)
    try {
      dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: { id: client.id, ...update } })
      await updateClient(client.id, update)
    } catch (err) {
      dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: client })
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Errore durante il salvataggio.' })
      throw err
    }
  }, [])

  const selectClient   = useCallback(client => dispatch({ type: ACTIONS.SELECT_CLIENT,   payload: client }), [])
  const deselectClient = useCallback(()       => dispatch({ type: ACTIONS.DESELECT_CLIENT }), [])

  return { ...state, handleAddClient, handleCampionamento, handleAddXP, selectClient, deselectClient }
}
