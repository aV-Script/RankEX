import { useState, useEffect, useCallback } from 'react'
import {
  getTrainerSlots, addSlot, updateSlot, deleteSlot,
  addRecurrence,
  generateRecurrenceDates,
  skipSlot,
} from '../../firebase/services/calendar'
import {
  addClientToGroupSlots,
  removeClientFromGroupSlots,
} from './calendarGroupUtils'
import { getMonthRange, getWeekRange } from '../../utils/calendarUtils'
import { closeSessionUseCase } from '../../usecases/closeSessionUseCase'
import { SLOT_STATUS } from '../../constants/slotStatus'
import { useToast } from '../../hooks/useToast'

export { calcMonthlyCompletion, getMonthRange, getWeekRange } from '../../utils/calendarUtils'

export function useCalendar(orgId) {
  const [slots, setSlots]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10))
  const [view, setView]             = useState('week') // 'month' | 'week' | 'day'
  const toast = useToast()

  // ── Calcola il range in base alla vista ────────────────────────────────
  const getRange = useCallback((date, v) => {
    if (v === 'week') return getWeekRange(date)
    if (v === 'day') return { from: date, to: date }
    const d = new Date(date + 'T12:00')
    return getMonthRange(d.getFullYear(), d.getMonth() + 1)
  }, [])

  const { from, to } = getRange(currentDate, view)

  const fetchSlots = useCallback(() => {
    if (!orgId) return
    setLoading(true)
    getTrainerSlots(orgId, from, to)
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [orgId, from, to])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  // ── Navigazione ───────────────────────────────────────────────────────
  const navigate = useCallback((direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev + 'T12:00')
      if (view === 'month') d.setMonth(d.getMonth() + direction)
      else if (view === 'week') d.setDate(d.getDate() + direction * 7)
      else d.setDate(d.getDate() + direction)
      return d.toISOString().slice(0, 10)
    })
  }, [view])

  const goToToday = useCallback(() => setCurrentDate(new Date().toISOString().slice(0, 10)), [])

  // ── Add slot ──────────────────────────────────────────────────────────
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
      await updateSlot(orgId, existing.id, { clientIds: updated.clientIds, groupIds: updated.groupIds })
      setSlots(prev => prev.map(s => s.id === existing.id ? updated : s))
      return updated
    }

    const ref = await addSlot(orgId, { date, startTime, endTime, clientIds, groupIds })
    const newSlot = {
      id: ref.id, date, startTime, endTime,
      clientIds, groupIds,
      status: SLOT_STATUS.PLANNED, attendees: [], absentees: [],
      recurrenceId: null,
    }
    setSlots(prev => [...prev, newSlot])
    return newSlot
  }, [orgId, slots])

  // ── Add recurrence ─────────────────────────────────────────────────────
  const handleAddRecurrence = useCallback(async ({
    clientIds, groupIds, days, startDate, endDate, startTime, endTime
  }) => {
    const recRef = await addRecurrence(orgId, {
      clientIds, groupIds, days,
      startDate, endDate, startTime, endTime,
    })
    const recurrenceId = recRef.id
    const dates = generateRecurrenceDates(startDate, endDate, days)

    for (const date of dates) {
      const slot = await handleAddSlot({ date, startTime, endTime, clientIds, groupIds })
      if (slot?.id) await updateSlot(orgId, slot.id, { recurrenceId })
    }

    fetchSlots()
    return recurrenceId
  }, [orgId, handleAddSlot, fetchSlots])

  // ── Close slot ─────────────────────────────────────────────────────────
  const handleCloseSlot = useCallback(async (slotId, attendeeIds, clientsData) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return

    const absenteeIds = slot.clientIds.filter(id => !attendeeIds.includes(id))
    const snapshot = slot

    setSlots(prev => prev.map(s => s.id === slotId ? {
      ...s,
      status: SLOT_STATUS.COMPLETED,
      attendees: attendeeIds,
      absentees: absenteeIds,
    } : s))

    try {
      await closeSessionUseCase(orgId, slot, attendeeIds, clientsData)
      toast.success('Sessione chiusa · +XP assegnata')
    } catch (err) {
      console.error('[closeSession]', err)
      setSlots(prev => prev.map(s => s.id === slotId ? snapshot : s))
      toast.error('Impossibile chiudere la sessione')
    }
  }, [orgId, slots, toast])

  // ── Skip slot ──────────────────────────────────────────────────────────
  const handleSkipSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.map(s => s.id === slotId ? {
      ...s, status: SLOT_STATUS.SKIPPED, attendees: [], absentees: [],
    } : s))
    try {
      await skipSlot(orgId, slotId)
    } catch {
      setSlots(prev => prev.map(s => s.id === slotId ? snapshot : s))
    }
  }, [orgId, slots])

  // ── Delete slot ────────────────────────────────────────────────────────
  const handleDeleteSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
    try {
      await deleteSlot(orgId, slotId)
    } catch {
      if (snapshot) setSlots(prev => [...prev, snapshot])
    }
  }, [orgId, slots])

  // ── Group handlers ─────────────────────────────────────────────────────
  const handleAddClientToGroupSlots = useCallback(async (groupId, clientId) => {
    await addClientToGroupSlots(orgId, groupId, clientId)
    fetchSlots()
  }, [orgId, fetchSlots])

  const handleRemoveClientFromGroupSlots = useCallback(async (groupId, clientId) => {
    await removeClientFromGroupSlots(orgId, groupId, clientId)
    fetchSlots()
  }, [orgId, fetchSlots])

  // ── Controllo max sessioni mensili per un cliente ──────────────────────
  const isClientOverMonthlyLimit = useCallback((client, date) => {
    const year  = new Date(date).getFullYear()
    const month = new Date(date).getMonth() + 1
    const f = `${year}-${String(month).padStart(2,'0')}-01`
    const t = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`

    const planned = slots.filter(s =>
      s.clientIds.includes(client.id) && s.date >= f && s.date <= t
    ).length

    return planned >= (client.maxMonthlySessions ?? 20)
  }, [slots])

  return {
    slots,
    isLoading: loading,
    currentDate,
    view,
    setView,
    navigate,
    goToToday,
    handleAddSlot,
    handleAddRecurrence,
    handleCloseSlot,
    handleSkipSlot,
    handleDeleteSlot,
    handleAddClientToGroupSlots,
    handleRemoveClientFromGroupSlots,
    fetchSlots,
    isClientOverMonthlyLimit,
  }
}
