import { useState, useEffect, useCallback, useRef } from 'react'
import { getTrainerSlots } from '../../firebase/services/calendar'
import {
  addClientToGroupSlots,
  removeClientFromGroupSlots,
} from './calendarGroupUtils'
import { getMonthRange, getWeekRange, toLocalDateStr } from '../../utils/calendarUtils'
import { closeSessionUseCase }    from '../../usecases/closeSessionUseCase'
import { addSlotUseCase }         from '../../usecases/addSlotUseCase'
import { deleteSlotUseCase }      from '../../usecases/deleteSlotUseCase'
import { skipSlotUseCase }        from '../../usecases/skipSlotUseCase'
import { addRecurrenceUseCase }   from '../../usecases/addRecurrenceUseCase'
import { SLOT_STATUS } from '../../constants/slotStatus'
import { useToast } from '../../hooks/useToast'
import { useTrainerState } from '../../context/TrainerContext'

export { calcMonthlyCompletion, getMonthRange, getWeekRange } from '../../utils/calendarUtils'

export function useCalendar(orgId) {
  const [slots, setSlots]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [currentDate, setCurrentDate] = useState(toLocalDateStr())
  const [view, setView]             = useState('week') // 'month' | 'week' | 'day'
  const { error: toastError } = useToast()
  // Termine del modulo nei toast (la sessione / l'allenamento / l'appuntamento)
  const { terminology } = useTrainerState()
  const { theSession, theSessions, ofTheGroup } = terminology
  const initialLoadDone = useRef(false)

  // ── Calcola il range in base alla vista ────────────────────────────────
  const getRange = useCallback((date, v) => {
    if (v === 'week') return getWeekRange(date)
    if (v === 'day') return { from: date, to: date }
    const d = new Date(date + 'T12:00')
    return getMonthRange(d.getFullYear(), d.getMonth() + 1)
  }, [])

  const { from, to } = getRange(currentDate, view)

  // Ogni lettura ha un numero progressivo: si applica solo la risposta dell'ultima.
  // Con le frecce cliccate in fretta la risposta di una settimana precedente
  // poteva arrivare dopo e mostrare gli slot della settimana sbagliata.
  const lastRequest = useRef(0)

  const fetchSlots = useCallback(() => {
    if (!orgId) return
    if (!initialLoadDone.current) setLoading(true)
    const requestId = ++lastRequest.current
    getTrainerSlots(orgId, from, to)
      .then(data => {
        if (requestId !== lastRequest.current) return
        setSlots(data)
        initialLoadDone.current = true
      })
      .catch(() => { if (requestId === lastRequest.current) toastError(`Impossibile caricare ${theSessions}`) })
      .finally(() => { if (requestId === lastRequest.current) setLoading(false) })
  }, [orgId, from, to, theSessions, toastError])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  // ── Navigazione ───────────────────────────────────────────────────────
  const navigate = useCallback((direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev + 'T12:00')
      // Giorno 1 prima di cambiare mese: dal 29-31 setMonth sforava nel mese dopo
      if (view === 'month') { d.setDate(1); d.setMonth(d.getMonth() + direction) }
      else if (view === 'week') d.setDate(d.getDate() + direction * 7)
      else d.setDate(d.getDate() + direction)
      return toLocalDateStr(d)
    })
  }, [view])

  const goToToday = useCallback(() => setCurrentDate(toLocalDateStr()), [])

  // ── Add slot ──────────────────────────────────────────────────────────
  const handleAddSlot = useCallback(async ({ date, startTime, endTime, clientIds, groupIds = [] }) => {
    // Ottimistic: aggiungi slot con id temporaneo
    const tempId  = `temp_${Date.now()}`
    const tempSlot = {
      id: tempId, date, startTime, endTime,
      clientIds, groupIds,
      status: SLOT_STATUS.PLANNED, attendees: [], absentees: [],
      recurrenceId: null,
    }
    setSlots(prev => [...prev, tempSlot])

    try {
      const slot = await addSlotUseCase(orgId, date, startTime, endTime, clientIds, groupIds)
      // Sostituisci il temp con il reale — se il BE ha fatto merge in uno slot
      // già esistente (stessa data+ora), rimuovi anche la sua vecchia entry
      // per evitare un doppione in UI
      setSlots(prev => [...prev.filter(s => s.id !== tempId && s.id !== slot.id), slot])
      return slot
    } catch {
      // Rimuovi lo slot temporaneo in caso di errore
      setSlots(prev => prev.filter(s => s.id !== tempId))
      toastError(`Impossibile aggiungere ${theSession}`)
      return null
    }
  }, [orgId, theSession, toastError])

  // ── Add recurrence ─────────────────────────────────────────────────────
  const handleAddRecurrence = useCallback(async ({
    clientIds, groupIds, days, startDate, endDate, startTime, endTime
  }) => {
    try {
      const result = await addRecurrenceUseCase({ orgId, clientIds, groupIds, days, startDate, endDate, startTime, endTime })
      fetchSlots()
      return result.id
    } catch {
      toastError('Impossibile creare la ricorrenza')
      fetchSlots()
      return null
    }
  }, [orgId, fetchSlots, toastError])

  // ── Close slot ─────────────────────────────────────────────────────────
  // Restituisce true se la chiusura è riuscita: il messaggio di conferma lo
  // sceglie il chiamante, perché dipende dal modulo (XP solo con gamification)
  const handleCloseSlot = useCallback(async (slotId, attendeeIds) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return false

    const absenteeIds = slot.clientIds.filter(id => !attendeeIds.includes(id))
    const snapshot = slot

    setSlots(prev => prev.map(s => s.id === slotId ? {
      ...s,
      status: SLOT_STATUS.COMPLETED,
      attendees: attendeeIds,
      absentees: absenteeIds,
    } : s))

    try {
      await closeSessionUseCase(orgId, slot, attendeeIds)
      return true
    } catch {
      setSlots(prev => prev.map(s => s.id === slotId ? snapshot : s))
      toastError(`Impossibile chiudere ${theSession}`)
      return false
    }
  }, [orgId, slots, theSession, toastError])

  // ── Skip slot ──────────────────────────────────────────────────────────
  const handleSkipSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.map(s => s.id === slotId ? {
      ...s, status: SLOT_STATUS.SKIPPED, attendees: [], absentees: [],
    } : s))
    try {
      await skipSlotUseCase(orgId, slotId)
    } catch {
      setSlots(prev => prev.map(s => s.id === slotId ? snapshot : s))
      toastError(`Impossibile saltare ${theSession}`)
    }
  }, [orgId, slots, theSession, toastError])

  // ── Delete slot ────────────────────────────────────────────────────────
  const handleDeleteSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
    try {
      await deleteSlotUseCase(orgId, slotId)
    } catch {
      if (snapshot) setSlots(prev => [...prev, snapshot])
      toastError(`Impossibile eliminare ${theSession}`)
    }
  }, [orgId, slots, theSession, toastError])

  // ── Group handlers ─────────────────────────────────────────────────────
  const handleAddClientToGroupSlots = useCallback(async (groupId, clientId) => {
    try {
      await addClientToGroupSlots(orgId, groupId, clientId)
      fetchSlots()
    } catch {
      toastError(`Impossibile aggiornare ${theSessions} ${ofTheGroup}`)
    }
  }, [orgId, fetchSlots, theSessions, ofTheGroup, toastError])

  const handleRemoveClientFromGroupSlots = useCallback(async (groupId, clientId) => {
    try {
      await removeClientFromGroupSlots(orgId, groupId, clientId)
      fetchSlots()
    } catch {
      toastError(`Impossibile aggiornare ${theSessions} ${ofTheGroup}`)
    }
  }, [orgId, fetchSlots, theSessions, ofTheGroup, toastError])

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
