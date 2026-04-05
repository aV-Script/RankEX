import { useState, useEffect, useCallback } from 'react'
import {
  getTrainerRecurrences,
  addRecurrence,
  updateRecurrence,
  cancelRecurrence,
  updateFutureSlots,
  deleteFutureSlots,
  addClientToRecurrence,
  removeClientFromRecurrence,
  generateRecurrenceDates,
  addSlot,
  updateSlot,
} from '../../firebase/services/calendar'

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
    const recRef       = await addRecurrence(orgId, {
      clientIds, groupIds, days,
      startDate, endDate, startTime, endTime,
    })
    const recurrenceId = recRef.id
    const dates        = generateRecurrenceDates(startDate, endDate, days)

    for (const date of dates) {
      const ref = await addSlot(orgId, { date, startTime, endTime, clientIds, groupIds })
      await updateSlot(orgId, ref.id, { recurrenceId })
    }

    const newRec = {
      id: recurrenceId, clientIds, groupIds,
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
      await Promise.all([
        updateRecurrence(orgId, recurrenceId, { startTime, endTime }),
        updateFutureSlots(orgId, recurrenceId, { startTime, endTime }),
      ])
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
      await updateRecurrence(orgId, recurrenceId, { days })
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
      const newDates = generateRecurrenceDates(
        (() => {
          const d = new Date(rec.endDate + 'T12:00')
          d.setDate(d.getDate() + 1)
          return d.toISOString().slice(0, 10)
        })(),
        newEndDate,
        rec.days,
      )

      await updateRecurrence(orgId, recurrenceId, { endDate: newEndDate })

      for (const date of newDates) {
        const ref = await addSlot(orgId, {
          date,
          startTime: rec.startTime,
          endTime:   rec.endTime,
          clientIds: rec.clientIds,
          groupIds:  rec.groupIds,
        })
        await updateSlot(orgId, ref.id, { recurrenceId })
      }
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
      await addClientToRecurrence(orgId, recurrenceId, clientId)
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
      await removeClientFromRecurrence(orgId, recurrenceId, clientId)
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
      await Promise.all([
        cancelRecurrence(orgId, recurrenceId),
        deleteFutureSlots(orgId, recurrenceId),
      ])
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
