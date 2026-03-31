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
 * Separato da useCalendar per evitare responsabilità eccessive.
 */
export function useRecurrences(trainerId) {
  const [recurrences, setRecurrences] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  // ── Fetch ──────────────────────────────────────────────────
  const refresh = useCallback(() => {
    if (!trainerId) return
    setLoading(true)
    setError(null)
    getTrainerRecurrences(trainerId)
      .then(setRecurrences)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [trainerId])

  useEffect(() => { refresh() }, [refresh])

  // ── Crea ricorrenza ────────────────────────────────────────
  const handleAddRecurrence = useCallback(async ({
    clientIds, groupIds, days,
    startDate, endDate, startTime, endTime,
  }) => {
    const recRef       = await addRecurrence({
      trainerId, clientIds, groupIds, days,
      startDate, endDate, startTime, endTime,
    })
    const recurrenceId = recRef.id
    const dates        = generateRecurrenceDates(startDate, endDate, days)

    for (const date of dates) {
      const ref = await addSlot({
        trainerId, date, startTime, endTime,
        clientIds, groupIds,
      })
      await updateSlot(ref.id, { recurrenceId })
    }

    const newRec = {
      id: recurrenceId, trainerId, clientIds, groupIds,
      days, startDate, endDate, startTime, endTime,
      status: 'active',
    }
    setRecurrences(prev => [newRec, ...prev])
    return newRec
  }, [trainerId])

  // ── Modifica orario ────────────────────────────────────────
  const handleUpdateTime = useCallback(async (recurrenceId, startTime, endTime) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, startTime, endTime } : r
    ))

    try {
      await Promise.all([
        updateRecurrence(recurrenceId, { startTime, endTime }),
        updateFutureSlots(recurrenceId, { startTime, endTime }),
      ])
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Modifica giorni ────────────────────────────────────────
  const handleUpdateDays = useCallback(async (recurrenceId, days) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)
    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, days } : r
    ))
    try {
      await updateRecurrence(recurrenceId, { days })
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Estendi periodo ────────────────────────────────────────
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

      await updateRecurrence(recurrenceId, { endDate: newEndDate })

      for (const date of newDates) {
        const ref = await addSlot({
          trainerId,
          date,
          startTime:  rec.startTime,
          endTime:    rec.endTime,
          clientIds:  rec.clientIds,
          groupIds:   rec.groupIds,
        })
        await updateSlot(ref.id, { recurrenceId })
      }
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences, trainerId])

  // ── Aggiungi cliente ───────────────────────────────────────
  const handleAddClient = useCallback(async (recurrenceId, clientId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId
        ? { ...r, clientIds: [...r.clientIds, clientId] }
        : r
    ))

    try {
      await addClientToRecurrence(recurrenceId, clientId)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Rimuovi cliente ────────────────────────────────────────
  const handleRemoveClient = useCallback(async (recurrenceId, clientId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId
        ? { ...r, clientIds: r.clientIds.filter(id => id !== clientId) }
        : r
    ))

    try {
      await removeClientFromRecurrence(recurrenceId, clientId)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Cancella ricorrenza ────────────────────────────────────
  const handleCancel = useCallback(async (recurrenceId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, status: 'cancelled' } : r
    ))

    try {
      await Promise.all([
        cancelRecurrence(recurrenceId),
        deleteFutureSlots(recurrenceId),
      ])
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

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
