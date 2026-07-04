import { useState, useEffect, useCallback } from 'react'
import { getTrainerRecurrences }              from '../../firebase/services/calendar'
import { addRecurrenceUseCase }               from '../../usecases/addRecurrenceUseCase'
import { updateRecurrenceTimeUseCase }        from '../../usecases/updateRecurrenceTimeUseCase'
import { updateRecurrenceDaysUseCase }        from '../../usecases/updateRecurrenceDaysUseCase'
import { extendRecurrenceUseCase }            from '../../usecases/extendRecurrenceUseCase'
import { addClientToRecurrenceUseCase }       from '../../usecases/addClientToRecurrenceUseCase'
import { removeClientFromRecurrenceUseCase }  from '../../usecases/removeClientFromRecurrenceUseCase'
import { cancelRecurrenceUseCase }            from '../../usecases/cancelRecurrenceUseCase'

/**
 * Hook per la gestione completa delle ricorrenze.
 */
export function useRecurrences(orgId) {
  const [recurrences, setRecurrences] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    getTrainerRecurrences(orgId)
      .then(setRecurrences)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId])

  useEffect(() => { refresh() }, [refresh])

  // ── Crea ricorrenza ────────────────────────────────────────────────────────
  const handleAddRecurrence = useCallback(async ({
    clientIds, groupIds, days,
    startDate, endDate, startTime, endTime,
  }) => {
    const result = await addRecurrenceUseCase({
      orgId, clientIds, groupIds, days,
      startDate, endDate, startTime, endTime,
    })
    const newRec = {
      id: result.id, clientIds, groupIds,
      days, startDate, endDate, startTime, endTime,
      status: 'active',
    }
    setRecurrences(prev => [newRec, ...prev])
    return newRec
  }, [orgId])

  // ── Modifica orario ────────────────────────────────────────────────────────
  const handleUpdateTime = useCallback(async (recurrenceId, startTime, endTime) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, startTime, endTime } : r
    ))

    try {
      await updateRecurrenceTimeUseCase(orgId, recurrenceId, startTime, endTime)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [orgId, recurrences])

  // ── Modifica giorni ────────────────────────────────────────────────────────
  const handleUpdateDays = useCallback(async (recurrenceId, days) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)
    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, days } : r
    ))
    try {
      await updateRecurrenceDaysUseCase(orgId, recurrenceId, days)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [orgId, recurrences])

  // ── Estendi periodo ────────────────────────────────────────────────────────
  const handleExtendPeriod = useCallback(async (recurrenceId, newEndDate) => {
    const rec      = recurrences.find(r => r.id === recurrenceId)
    if (!rec) return
    const snapshot = rec

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, endDate: newEndDate } : r
    ))

    try {
      await extendRecurrenceUseCase(orgId, recurrenceId, newEndDate)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [orgId, recurrences])

  // ── Aggiungi cliente ───────────────────────────────────────────────────────
  const handleAddClient = useCallback(async (recurrenceId, clientId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId
        ? { ...r, clientIds: [...r.clientIds, clientId] }
        : r
    ))

    try {
      await addClientToRecurrenceUseCase(orgId, recurrenceId, clientId)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [orgId, recurrences])

  // ── Rimuovi cliente ────────────────────────────────────────────────────────
  const handleRemoveClient = useCallback(async (recurrenceId, clientId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId
        ? { ...r, clientIds: r.clientIds.filter(id => id !== clientId) }
        : r
    ))

    try {
      await removeClientFromRecurrenceUseCase(orgId, recurrenceId, clientId)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [orgId, recurrences])

  // ── Cancella ricorrenza ────────────────────────────────────────────────────
  const handleCancel = useCallback(async (recurrenceId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, status: 'cancelled' } : r
    ))

    try {
      await cancelRecurrenceUseCase(orgId, recurrenceId)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [orgId, recurrences])

  return {
    recurrences,
    loading,
    error,
    refresh,
    handleAddRecurrence,
    handleUpdateTime,
    handleUpdateDays,
    handleExtendPeriod,
    handleAddClient,
    handleRemoveClient,
    handleCancel,
  }
}
