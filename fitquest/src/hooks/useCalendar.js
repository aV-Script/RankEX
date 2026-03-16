import { useState, useEffect, useCallback } from 'react'
import {
  getTrainerSlots, addSlot, updateSlot, deleteSlot,
  addClientToSlot, removeClientFromSlot,
  getSlotsByGroup, addRecurrence, deleteRecurrence,
  generateRecurrenceDates,
} from '../firebase/calendar'
import { updateClient, addNotification } from '../firebase/services'
import { buildXPUpdate } from '../utils/gamification'

export const MONTHLY_XP_TARGET   = 500
export const BONUS_XP_FULL_MONTH = 200
export const WEEKS_PER_MONTH     = 4.33

export function calcSessionConfig(sessionsPerWeek) {
  const freq        = Math.max(1, Math.min(7, Math.round(sessionsPerWeek)))
  const monthlySess = Math.round(freq * WEEKS_PER_MONTH)
  const xpPerSess   = Math.round(MONTHLY_XP_TARGET / monthlySess)
  return { sessionsPerWeek: freq, monthlySessions: monthlySess, xpPerSession: xpPerSess }
}

export function getMonthRange(year, month) {
  const from    = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to      = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  return { from, to }
}

export function calcMonthlyCompletion(clientSlots, clientId) {
  const planned   = clientSlots.length
  const completed = clientSlots.filter(s => s.completedClientIds?.includes(clientId)).length
  if (planned === 0) return { planned: 0, completed: 0, pct: 0 }
  return { planned, completed, pct: Math.round((completed / planned) * 100) }
}

export function useCalendar(trainerId) {
  const [slots,        setSlots]        = useState([])
  const [loading,      setLoading]      = useState(false)
  const [currentYear,  setCurrentYear]  = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)

  const { from, to } = getMonthRange(currentYear, currentMonth)

  const refresh = useCallback(() => {
    if (!trainerId) return
    setLoading(true)
    getTrainerSlots(trainerId, from, to)
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [trainerId, from, to])

  useEffect(() => { refresh() }, [refresh])

  /**
   * Crea uno slot per una data specifica.
   * Se esiste già uno slot nella stessa data con stesso orario, aggiunge i clienti a quello.
   * Altrimenti crea un nuovo slot.
   */
  const handleAddSlot = useCallback(async ({ date, startTime, endTime, clientIds, groupIds = [] }) => {
    // Controlla se esiste già uno slot nella stessa data e orario
    const existing = slots.find(s => s.date === date && s.startTime === startTime)

    if (existing) {
      // Aggiunge i nuovi clienti allo slot esistente
      const newClientIds = clientIds.filter(id => !existing.clientIds.includes(id))
      const newGroupIds  = groupIds.filter(id => !existing.groupIds.includes(id))
      if (newClientIds.length === 0 && newGroupIds.length === 0) return existing

      await updateSlot(existing.id, {
        clientIds: [...existing.clientIds, ...newClientIds],
        groupIds:  [...existing.groupIds,  ...newGroupIds],
      })
      const updated = {
        ...existing,
        clientIds: [...existing.clientIds, ...newClientIds],
        groupIds:  [...existing.groupIds,  ...newGroupIds],
      }
      setSlots(prev => prev.map(s => s.id === existing.id ? updated : s))
      return updated
    }

    // Crea nuovo slot
    const ref    = await addSlot({ trainerId, date, startTime, endTime, clientIds, groupIds })
    const newSlot = {
      id: ref.id, trainerId, date, startTime, endTime,
      clientIds, groupIds, completedClientIds: [], recurrenceId: null,
    }
    setSlots(prev => [...prev, newSlot])
    return newSlot
  }, [slots, trainerId])

  /**
   * Crea una ricorrenza e genera tutti gli slot corrispondenti.
   */
  const handleAddRecurrence = useCallback(async ({
    clientIds, groupIds, days, startDate, endDate, startTime, endTime
  }) => {
    // Salva la ricorrenza
    const recRef = await addRecurrence({
      trainerId, clientIds, groupIds, days,
      startDate, endDate, startTime, endTime,
    })
    const recurrenceId = recRef.id

    // Genera tutte le date
    const dates = generateRecurrenceDates(startDate, endDate, days)

    // Crea uno slot per ogni data (o aggiorna esistente)
    for (const date of dates) {
      await handleAddSlot({ date, startTime, endTime, clientIds, groupIds })
      // Aggiorna il recurrenceId sullo slot appena creato/modificato
      const slot = slots.find(s => s.date === date && s.startTime === startTime)
      if (slot) await updateSlot(slot.id, { recurrenceId })
    }

    refresh()
    return recurrenceId
  }, [slots, trainerId, handleAddSlot, refresh])

  /**
   * Completa uno slot per un cliente specifico.
   */
  const handleCompleteClient = useCallback(async (slotId, client) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot || slot.completedClientIds?.includes(client.id)) return

    const newCompleted = [...(slot.completedClientIds ?? []), client.id]
    await updateSlot(slotId, { completedClientIds: newCompleted })
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, completedClientIds: newCompleted } : s
    ))

    const config = calcSessionConfig(client.sessionsPerWeek ?? 3)
    const { update } = buildXPUpdate(client, config.xpPerSession, 'Sessione di allenamento completata')
    await updateClient(client.id, update)

    if (client.clientAuthUid) {
      await addNotification({
        clientId: client.id,
        message:  `Sessione del ${slot.date} completata! +${config.xpPerSession} XP`,
        date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        type:     'session',
      })
    }
  }, [slots])

  /**
   * Completa tutti i clienti di uno slot.
   */
  const handleCompleteAllClients = useCallback(async (slotId, clientsData) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return
    const pending = slot.clientIds.filter(id => !slot.completedClientIds?.includes(id))
    for (const clientId of pending) {
      const client = clientsData.find(c => c.id === clientId)
      if (client) await handleCompleteClient(slotId, client)
    }
  }, [slots, handleCompleteClient])

  const handleDeleteSlot = useCallback(async (slotId) => {
    await deleteSlot(slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }, [])

  /**
   * Aggiunge un cliente a tutti gli slot futuri di un gruppo da una data.
   */
  const handleAddClientToGroupSlots = useCallback(async (groupId, clientId, fromDate) => {
    const groupSlots = await getSlotsByGroup(trainerId, groupId, fromDate)
    await Promise.all(
      groupSlots
        .filter(s => !s.clientIds.includes(clientId))
        .map(s => addClientToSlot(s.id, clientId))
    )
    refresh()
  }, [trainerId, refresh])

  /**
   * Rimuove un cliente da tutti gli slot futuri di un gruppo da una data.
   */
  const handleRemoveClientFromGroupSlots = useCallback(async (groupId, clientId, fromDate) => {
    const groupSlots = await getSlotsByGroup(trainerId, groupId, fromDate)
    await Promise.all(
      groupSlots
        .filter(s => s.clientIds.includes(clientId))
        .map(s => removeClientFromSlot(s.id, clientId))
    )
    refresh()
  }, [trainerId, refresh])

  const goToPrevMonth = useCallback(() =>
    setCurrentMonth(m => { if (m === 1) { setCurrentYear(y => y - 1); return 12 } return m - 1 }), [])
  const goToNextMonth = useCallback(() =>
    setCurrentMonth(m => { if (m === 12) { setCurrentYear(y => y + 1); return 1 } return m + 1 }), [])

  return {
    slots, loading,
    currentYear, currentMonth,
    goToPrevMonth, goToNextMonth,
    handleAddSlot,
    handleAddRecurrence,
    handleCompleteClient,
    handleCompleteAllClients,
    handleDeleteSlot,
    handleAddClientToGroupSlots,
    handleRemoveClientFromGroupSlots,
    refresh,
  }
}
