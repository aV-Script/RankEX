import { useState, useEffect, useCallback } from 'react'
import { getGoals }         from '../firebase/services/goals'
import { addGoalUseCase }   from '../usecases/addGoalUseCase'
import { cancelGoalUseCase } from '../usecases/cancelGoalUseCase'
import { useToast }         from './useToast'

/**
 * Hook per la gestione degli obiettivi (target percentile su un test, con
 * scadenza) di un cliente. Sola lettura diretta (service) — create/cancel
 * passano da Cloud Function (stesso pattern di useNotes), l'achievement è
 * scritto server-side dentro salvaCampionamento, mai dal client.
 *
 * @param {string} orgId
 * @param {string} clientId
 */
export function useGoals(orgId, clientId) {
  const { error: toastError } = useToast()
  const [goals,   setGoals]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId || !clientId) return
    setLoading(true)
    getGoals(orgId, clientId)
      .then(data => setGoals(data))
      .catch(() => toastError('Impossibile caricare gli obiettivi'))
      .finally(() => setLoading(false))
  }, [orgId, clientId, toastError])

  const handleAddGoal = useCallback(async (goalInput) => {
    try {
      const item = await addGoalUseCase(orgId, clientId, goalInput)
      setGoals(prev => [item, ...prev])
      return true
    } catch {
      toastError('Impossibile creare l\'obiettivo')
      return false
    }
  }, [orgId, clientId, toastError])

  const handleCancelGoal = useCallback(async (goalId) => {
    const snapshot = goals
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: 'cancelled' } : g))
    try {
      await cancelGoalUseCase(orgId, clientId, goalId)
    } catch {
      setGoals(snapshot)
      toastError('Impossibile annullare l\'obiettivo')
    }
  }, [orgId, clientId, goals, toastError])

  return { goals, loading, handleAddGoal, handleCancelGoal }
}
