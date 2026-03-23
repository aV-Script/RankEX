import { useState, useEffect, useCallback } from 'react'
import {
  getTrainerSlots, addSlot, updateSlot, deleteSlot,
  addClientToSlot, removeClientFromSlot,
  getSlotsByGroup, addRecurrence,
  generateRecurrenceDates,
  closeSlot, skipSlot,
} from '../../firebase/services/calendar'
import { updateClient }    from '../../firebase/services/clients'
import { addNotification } from '../../firebase/services/notifications'
import { buildXPUpdate, calcSessionConfig } from '../../utils/gamification'
import { useToast }        from '../../hooks/useToast'

export { calcSessionConfig }

export function getMonthRange(year, month) {
  const from    = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to      = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  return { from, to }
}

export function getWeekRange(date) {
  const d      = new Date(date + 'T12:00')
  const day    = d.getDay()
  const diff   = (day + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    from: monday.toISOString().slice(0, 10),
    to:   sunday.toISOString().slice(0, 10),
  }
}

export function calcMonthlyCompletion(clientSlots, clientId) {
  const planned   = clientSlots.length
  const completed = clientSlots.filter(s => s.attendees?.includes(clientId)).length
  if (planned === 0) return { planned: 0, completed: 0, pct: 0 }
  return { planned, completed, pct: Math.round((completed / planned) * 100) }
}

export function useCalendar(trainerId) {
  const [slots,        setSlots]        = useState([])
  const [loading,      setLoading]      = useState(false)
  const [currentDate,  setCurrentDate]  = useState(new Date().toISOString().slice(0, 10))
  const [view,         setView]         = useState('week') // 'month' | 'week' | 'day'
  const toast                           = useToast()

  // Calcola il range in base alla vista
  const getRange = useCallback((date, v) => {
    if (v === 'week') return getWeekRange(date)
    if (v === 'day')  return { from: date, to: date }
    const d = new Date(date + 'T12:00')
    return getMonthRange(d.getFullYear(), d.getMonth() + 1)
  }, [])

  const { from, to } = getRange(currentDate, view)

  const refresh = useCallback(() => {
    if (!trainerId) return
    setLoading(true)
    getTrainerSlots(trainerId, from, to)
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [trainerId, from, to])

  useEffect(() => { refresh() }, [refresh])

  // ── Navigazione ───────────────────────────────────────────────────────────
  const navigate = useCallback((direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev + 'T12:00')
      if (view === 'month') {
        d.setMonth(d.getMonth() + direction)
      } else if (view === 'week') {
        d.setDate(d.getDate() + direction * 7)
      } else {
        d.setDate(d.getDate() + direction)
      }
      return d.toISOString().slice(0, 10)
    })
  }, [view])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date().toISOString().slice(0, 10))
  }, [])

  // ── Add slot ──────────────────────────────────────────────────────────────
  const handleAddSlot = useCallback(async ({ date, startTime, endTime, clientIds, groupIds = [] }) => {
    const existing = slots.find(s => s.date === date && s.startTime === startTime)

    if (existing) {
      const newClientIds = clientIds.filter(id => !existing.clientIds.includes(id))
      const newGroupIds  = groupIds.filter(id => !existing.groupIds?.includes(id))
      if (newClientIds.length === 0 && newGroupIds.length === 0) return existing

      const updated = {
        ...existing,
        clientIds: [...existing.clientIds, ...newClientIds],
        groupIds:  [...(existing.groupIds ?? []), ...newGroupIds],
      }
      await updateSlot(existing.id, { clientIds: updated.clientIds, groupIds: updated.groupIds })
      setSlots(prev => prev.map(s => s.id === existing.id ? updated : s))
      return updated
    }

    const ref     = await addSlot({ trainerId, date, startTime, endTime, clientIds, groupIds })
    const newSlot = {
      id: ref.id, trainerId, date, startTime, endTime,
      clientIds, groupIds,
      status: 'planned', attendees: [], absentees: [],
      recurrenceId: null,
    }
    setSlots(prev => [...prev, newSlot])
    return newSlot
  }, [slots, trainerId])

  // ── Add recurrence ────────────────────────────────────────────────────────
  const handleAddRecurrence = useCallback(async ({
    clientIds, groupIds, days, startDate, endDate, startTime, endTime
  }) => {
    const recRef       = await addRecurrence({
      trainerId, clientIds, groupIds, days,
      startDate, endDate, startTime, endTime,
    })
    const recurrenceId = recRef.id
    const dates        = generateRecurrenceDates(startDate, endDate, days)

    for (const date of dates) {
      const slot = await handleAddSlot({ date, startTime, endTime, clientIds, groupIds })
      if (slot?.id) await updateSlot(slot.id, { recurrenceId })
    }

    refresh()
    return recurrenceId
  }, [trainerId, handleAddSlot, refresh])

  // ── Close slot — assegna XP ai presenti ───────────────────────────────────
  const handleCloseSlot = useCallback(async (slotId, attendeeIds, clientsData) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return

    const absenteeIds = slot.clientIds.filter(id => !attendeeIds.includes(id))
    const snapshot    = slot

    setSlots(prev => prev.map(s => s.id === slotId ? {
      ...s,
      status:    'completed',
      attendees:  attendeeIds,
      absentees:  absenteeIds,
    } : s))

    try {
      await closeSlot(slotId, { attendees: attendeeIds, absentees: absenteeIds })

      await Promise.all(
        attendeeIds.map(async clientId => {
          const client = clientsData.find(c => c.id === clientId)
          if (!client) return
          const config     = calcSessionConfig(client.sessionsPerWeek ?? 3)
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
        })
      )

      await Promise.all(
        absenteeIds.map(async clientId => {
          const client = clientsData.find(c => c.id === clientId)
          if (!client?.clientAuthUid) return
          await addNotification({
            clientId: client.id,
            message:  `Sessione del ${slot.date} — assenza registrata.`,
            date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
            type:     'absence',
          })
        })
      )
      toast.success('Sessione chiusa · +XP assegnata')
    } catch {
      setSlots(prev => prev.map(s => s.id === slotId ? snapshot : s))
      toast.error('Impossibile chiudere la sessione')
    }
  }, [slots, toast])

  // ── Skip slot ─────────────────────────────────────────────────────────────
  const handleSkipSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.map(s => s.id === slotId ? {
      ...s, status: 'skipped', attendees: [], absentees: [],
    } : s))
    try {
      await skipSlot(slotId)
    } catch {
      setSlots(prev => prev.map(s => s.id === slotId ? snapshot : s))
    }
  }, [slots])

  // ── Delete slot ───────────────────────────────────────────────────────────
  const handleDeleteSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
    try {
      await deleteSlot(slotId)
    } catch {
      if (snapshot) setSlots(prev => [...prev, snapshot])
    }
  }, [slots])

  // ── Group handlers ────────────────────────────────────────────────────────
  const handleAddClientToGroupSlots = useCallback(async (groupId, clientId, fromDate) => {
    const groupSlots = await getSlotsByGroup(trainerId, groupId, fromDate)
    await Promise.all(
      groupSlots
        .filter(s => !s.clientIds.includes(clientId))
        .map(s => addClientToSlot(s.id, clientId))
    )
    refresh()
  }, [trainerId, refresh])

  const handleRemoveClientFromGroupSlots = useCallback(async (groupId, clientId, fromDate) => {
    const groupSlots = await getSlotsByGroup(trainerId, groupId, fromDate)
    await Promise.all(
      groupSlots
        .filter(s => s.clientIds.includes(clientId))
        .map(s => removeClientFromSlot(s.id, clientId))
    )
    refresh()
  }, [trainerId, refresh])

  return {
    slots, loading,
    currentDate, view,
    setView, navigate, goToToday,
    handleAddSlot,
    handleAddRecurrence,
    handleCloseSlot,
    handleSkipSlot,
    handleDeleteSlot,
    handleAddClientToGroupSlots,
    handleRemoveClientFromGroupSlots,
    refresh,
  }
}