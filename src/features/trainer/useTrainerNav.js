import { useState, useCallback } from 'react'
import { useTrainerState, useTrainerDispatch, ACTIONS } from '../../context/TrainerContext'

/**
 * Gestisce la navigazione dell'area trainer.
 *
 * La navigazione ha due livelli:
 *   1. page — la sezione attiva nella sidebar
 *   2. selectedClient — se presente, sovrascrive la pagina e mostra ClientDashboard
 *
 * navigateTo accetta un secondo argomento opzionale `params` che viene
 * passato alla pagina di destinazione (es. { initialRecurrenceId }).
 */
export function useTrainerNav() {
  const [page,      setPage]      = useState('clients')
  const [navParams, setNavParams] = useState(null)
  const [navKey,    setNavKey]    = useState(0)
  const { selectedClient } = useTrainerState()
  const dispatch           = useTrainerDispatch()

  const navigateTo = useCallback((newPage, params = null) => {
    setPage(newPage)
    setNavParams(params)
    setNavKey(k => k + 1)
    dispatch({ type: ACTIONS.DESELECT_CLIENT })
  }, [dispatch])

  const selectClient = useCallback((client) => {
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: client })
  }, [dispatch])

  const deselectClient = useCallback(() => {
    dispatch({ type: ACTIONS.DESELECT_CLIENT })
  }, [dispatch])

  return { page, navKey, navParams, selectedClient, navigateTo, selectClient, deselectClient }
}
