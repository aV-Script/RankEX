import { useState, useMemo } from 'react'
import { useCalendar, calcSessionConfig, calcMonthlyCompletion } from '../../hooks/useCalendar'
import { useGroups } from '../../hooks/useGroups'
import { AppNav }    from '../layout/AppNav'
import { SectionLabel } from '../ui'
import { generateRecurrenceDates } from '../../firebase/calendar'

const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const DAY_NAMES   = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
const WEEK_DAYS   = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mer' },
  { value: 4, label: 'Gio' }, { value: 5, label: 'Ven' }, { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

export function TrainerCalendar({ trainerId, clients }) {
  const {
    slots, loading, currentYear, currentMonth,
    goToPrevMonth, goToNextMonth,
    handleAddSlot, handleAddRecurrence,
    handleCompleteClient, handleCompleteAllClients,
    handleDeleteSlot,
  } = useCalendar(trainerId)

  const { groups } = useGroups(trainerId)

  const [selectedDate, setSelectedDate] = useState(null)
  const [showAdd,      setShowAdd]      = useState(false)
  const [showRecurr,   setShowRecurr]   = useState(false)
  const [showGroups,   setShowGroups]   = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  // Raggruppa slot per data
  const slotsByDate = useMemo(() => {
    const map = {}
    slots.forEach(s => { if (!map[s.date]) map[s.date] = []; map[s.date].push(s) })
    return map
  }, [slots])

  // Griglia mese
  const calendarDays = useMemo(() => {
    const firstDay    = new Date(currentYear, currentMonth - 1, 1)
    const lastDay     = new Date(currentYear, currentMonth, 0)
    const startOffset = (firstDay.getDay() + 6) % 7
    const days = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      days.push({ day: d, dateStr, slots: slotsByDate[dateStr] ?? [] })
    }
    return days
  }, [currentYear, currentMonth, slotsByDate])

  // Slot del giorno selezionato con dati cliente
  const selectedSlots = useMemo(() => {
    if (!selectedDate) return []
    return (slotsByDate[selectedDate] ?? [])
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
      .map(s => ({ ...s, clientsData: s.clientIds.map(id => clients.find(c => c.id === id)).filter(Boolean) }))
  }, [selectedDate, slotsByDate, clients])

  // Panoramica mensile per sidebar
  const monthlyOverview = useMemo(() =>
    clients
      .map(client => {
        const clientSlots = slots.filter(s => s.clientIds.includes(client.id))
        const { planned, completed, pct } = calcMonthlyCompletion(clientSlots, client.id)
        const { monthlySessions } = calcSessionConfig(client.sessionsPerWeek ?? 3)
        const overLimit = planned > monthlySessions
        return { client, planned, completed, pct, monthlySessions, overLimit }
      })
      .filter(r => r.planned > 0)
  , [clients, slots])

  return (
    <div className="text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <h1 className="font-display font-black text-[20px] text-white m-0">Calendario</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowRecurr(true)}
            className="bg-transparent border border-white/10 rounded-xl px-3 py-1.5 text-white/40 font-display text-[11px] tracking-widest cursor-pointer hover:text-white/60 transition-all">
            RICORRENZA
          </button>
          <button onClick={() => { setSelectedDate(today); setShowAdd(true) }}
            className="rounded-xl px-4 py-2 font-display text-[11px] tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
            NUOVA SESSIONE
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-113px)] lg:min-h-[calc(100vh-57px)]">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/[.05] p-5 gap-4 sticky top-0 h-screen overflow-y-auto">
          <div>
            <SectionLabel>MESE IN CORSO</SectionLabel>
            {monthlyOverview.length === 0
              ? <p className="font-body text-[12px] text-white/20">Nessuna sessione pianificata.</p>
              : monthlyOverview.map(({ client, planned, completed, pct, monthlySessions, overLimit }) => (
                <div key={client.id} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-body text-[12px] text-white/70 truncate flex-1">{client.name}</span>
                    <span className="font-display text-[11px] ml-2 shrink-0"
                      style={{ color: overLimit ? '#f87171' : pct === 100 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171' }}>
                      {completed}/{planned}
                      {overLimit && <span className="text-[9px] ml-1">⚠ max {monthlySessions}</span>}
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min(100, pct)}%`, background: overLimit ? '#f87171' : pct === 100 ? '#34d399' : '#f59e0b' }} />
                  </div>
                </div>
              ))
            }
          </div>

          {groups.length > 0 && (
            <div>
              <SectionLabel>GRUPPI</SectionLabel>
              {groups.map(g => (
                <div key={g.id} className="flex items-center justify-between py-1.5">
                  <span className="font-body text-[12px] text-white/50">{g.name}</span>
                  <span className="font-display text-[10px] text-white/25">{g.clientIds.length} clienti</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Calendario principale */}
        <main className="flex-1 px-4 lg:px-6 py-5 min-w-0">

          {/* Navigazione mese */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={goToPrevMonth}
              className="bg-transparent border border-white/10 rounded-xl w-9 h-9 flex items-center justify-center cursor-pointer hover:border-white/20 transition-all text-white/40 hover:text-white/70 text-[18px]">
              ‹
            </button>
            <h2 className="font-display font-black text-[18px] text-white">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h2>
            <button onClick={goToNextMonth}
              className="bg-transparent border border-white/10 rounded-xl w-9 h-9 flex items-center justify-center cursor-pointer hover:border-white/20 transition-all text-white/40 hover:text-white/70 text-[18px]">
              ›
            </button>
          </div>

          {/* Header giorni */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center font-display text-[10px] text-white/30 tracking-[2px] py-1">{d}</div>
            ))}
          </div>

          {/* Griglia */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} />
              const isToday    = cell.dateStr === today
              const isSelected = cell.dateStr === selectedDate
              const total      = cell.slots.reduce((n, s) => n + s.clientIds.length, 0)
              const done       = cell.slots.reduce((n, s) => n + (s.completedClientIds?.length ?? 0), 0)

              return (
                <button key={cell.dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                  className="rounded-xl p-1.5 min-h-[56px] flex flex-col items-center gap-1 cursor-pointer transition-all border"
                  style={{
                    background:  isSelected ? 'rgba(59,130,246,0.15)' : isToday ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    borderColor: isSelected ? '#3b82f6' : isToday ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  }}>
                  <span className="font-display text-[12px]"
                    style={{ color: isToday ? '#60a5fa' : isSelected ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                    {cell.day}
                  </span>
                  {cell.slots.length > 0 && (
                    <div className="flex flex-col items-center gap-0.5 w-full px-1">
                      {cell.slots.slice(0, 2).map(s => {
                        const slotDone = s.completedClientIds?.length ?? 0
                        const slotTot  = s.clientIds.length
                        const allDone  = slotDone === slotTot && slotTot > 0
                        return (
                          <div key={s.id} className="flex items-center gap-1 w-full">
                            <div className="h-[2px] flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <div style={{ width: `${slotTot > 0 ? Math.round(slotDone/slotTot*100) : 0}%`, height: '100%', background: allDone ? '#34d399' : '#f59e0b' }} />
                            </div>
                            {s.startTime && (
                              <span className="font-display text-[8px] text-white/25 shrink-0">{s.startTime}</span>
                            )}
                          </div>
                        )
                      })}
                      {cell.slots.length > 2 && (
                        <span className="font-display text-[8px] text-white/25">+{cell.slots.length - 2}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Dettaglio giorno */}
          {selectedDate && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel className="mb-0">
                  {new Date(selectedDate + 'T12:00').toLocaleDateString('it-IT', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </SectionLabel>
                <button onClick={() => setShowAdd(true)}
                  className="text-[11px] font-display px-3 py-1.5 rounded-lg cursor-pointer border transition-all"
                  style={{ color: '#60a5fa', borderColor: '#60a5fa55', background: '#60a5fa11' }}>
                  AGGIUNGI
                </button>
              </div>

              {selectedSlots.length === 0
                ? <p className="font-body text-[13px] text-white/20">Nessuno slot per questo giorno.</p>
                : selectedSlots.map(slot => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    clients={clients}
                    onCompleteClient={client => handleCompleteClient(slot.id, client)}
                    onCompleteAll={() => handleCompleteAllClients(slot.id, clients)}
                    onDelete={() => handleDeleteSlot(slot.id)}
                  />
                ))
              }
            </div>
          )}
        </main>
      </div>

      {showAdd && (
        <AddSlotModal
          date={selectedDate || today}
          clients={clients}
          groups={groups}
          slots={slots}
          onClose={() => setShowAdd(false)}
          onSave={async (data) => { await handleAddSlot(data); setShowAdd(false) }}
        />
      )}

      {showRecurr && (
        <RecurrenceModal
          clients={clients}
          groups={groups}
          onClose={() => setShowRecurr(false)}
          onSave={async (data) => { await handleAddRecurrence(data); setShowRecurr(false) }}
        />
      )}
    </div>
  )
}

// ── SlotCard ──────────────────────────────────────────────────────────────────
function SlotCard({ slot, clients, onCompleteClient, onCompleteAll, onDelete }) {
  const allDone = slot.completedClientIds?.length === slot.clientIds.length && slot.clientIds.length > 0

  return (
    <div className="rounded-2xl p-4 mb-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {slot.startTime && (
            <span className="font-display text-[12px] text-white/60">
              {slot.startTime}{slot.endTime ? ` → ${slot.endTime}` : ''}
            </span>
          )}
          {slot.recurrenceId && (
            <span className="font-display text-[9px] px-2 py-0.5 rounded-md"
              style={{ background: '#8b5cf622', color: '#a78bfa' }}>RICORRENTE</span>
          )}
        </div>
        <div className="flex gap-2">
          {!allDone && (
            <button onClick={onCompleteAll}
              className="text-[10px] font-display px-2.5 py-1 rounded-lg cursor-pointer border transition-all"
              style={{ color: '#34d399', borderColor: '#34d39955', background: '#34d39911' }}>
              TUTTI ✓
            </button>
          )}
          <button onClick={onDelete}
            className="text-[10px] font-display px-2.5 py-1 rounded-lg cursor-pointer border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 transition-all">
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {slot.clientIds.map(clientId => {
          const client   = clients.find(c => c.id === clientId)
          const completed = slot.completedClientIds?.includes(clientId)
          return (
            <div key={clientId}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{
                background:  completed ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${completed ? '#34d39933' : 'rgba(255,255,255,0.06)'}`,
              }}>
              <button
                onClick={() => !completed && client && onCompleteClient(client)}
                disabled={completed}
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
                style={{
                  background:  completed ? '#34d399' : 'transparent',
                  borderColor: completed ? '#34d399' : 'rgba(255,255,255,0.2)',
                  cursor:      completed ? 'default' : 'pointer',
                }}>
                {completed && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className="font-body text-[13px] flex-1"
                style={{ color: completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)' }}>
                {client?.name ?? '—'}
              </span>
              {completed && (
                <span className="font-display text-[10px] text-emerald-400">
                  +{calcSessionConfig(client?.sessionsPerWeek ?? 3).xpPerSession} XP
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── AddSlotModal ──────────────────────────────────────────────────────────────
function AddSlotModal({ date, clients, groups, slots, onClose, onSave }) {
  const [selectedDate,    setSelectedDate]    = useState(date)
  const [startTime,       setStartTime]       = useState('09:00')
  const [endTime,         setEndTime]         = useState('10:00')
  const [selectedClients, setSelectedClients] = useState([])
  const [selectedGroups,  setSelectedGroups]  = useState([])

  const today = new Date().toISOString().slice(0, 10)

  const toggleClient = (id) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectGroup = (group) => {
    setSelectedGroups(prev =>
      prev.includes(group.id) ? prev.filter(x => x !== group.id) : [...prev, group.id]
    )
    setSelectedClients(prev => {
      const next = new Set(prev)
      group.clientIds.forEach(id => next.add(id))
      return [...next]
    })
  }

  // Avviso massimale: clienti che superano le sessioni del mese
  const overLimitClients = useMemo(() => {
    return selectedClients.filter(clientId => {
      const client     = clients.find(c => c.id === clientId)
      if (!client) return false
      const { monthlySessions } = calcSessionConfig(client.sessionsPerWeek ?? 3)
      const year  = new Date(selectedDate).getFullYear()
      const month = new Date(selectedDate).getMonth() + 1
      const from  = `${year}-${String(month).padStart(2,'0')}-01`
      const to    = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`
      const planned = slots.filter(s =>
        s.clientIds.includes(clientId) &&
        s.date >= from && s.date <= to
      ).length
      return planned >= monthlySessions
    })
  }, [selectedClients, clients, slots, selectedDate])

  const canSave = selectedClients.length > 0 && overLimitClients.length === 0

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display text-white text-[15px] m-0">Nuova sessione</h3>
          <button onClick={onClose} className="bg-transparent border-none text-white/40 text-xl cursor-pointer">✕</button>
        </div>

        {/* Data */}
        <div className="mb-4">
          <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">DATA</label>
          <input type="date" value={selectedDate} min={today}
            onChange={e => setSelectedDate(e.target.value)}
            className="input-base w-full" style={{ colorScheme: 'dark' }} />
        </div>

        {/* Orari */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">INIZIO</label>
            <input type="time" value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">FINE</label>
            <input type="time" value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Gruppi */}
        {groups.length > 0 && (
          <div className="mb-4">
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-2">GRUPPO</label>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button key={g.id} onClick={() => selectGroup(g)}
                  className="rounded-xl px-3 py-1.5 font-display text-[11px] cursor-pointer border transition-all"
                  style={selectedGroups.includes(g.id)
                    ? { background: 'rgba(139,92,246,0.15)', borderColor: '#8b5cf655', color: '#a78bfa' }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {g.name} ({g.clientIds.length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clienti */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-display text-[10px] text-white/30 tracking-[2px]">CLIENTI</label>
            <div className="flex gap-2">
              <button onClick={() => setSelectedClients(clients.map(c => c.id))}
                className="font-display text-[9px] text-white/30 cursor-pointer hover:text-white/50 bg-transparent border-none p-0">
                TUTTI
              </button>
              <span className="text-white/15">·</span>
              <button onClick={() => setSelectedClients([])}
                className="font-display text-[9px] text-white/30 cursor-pointer hover:text-white/50 bg-transparent border-none p-0">
                NESSUNO
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
            {clients.map(c => {
              const isSelected  = selectedClients.includes(c.id)
              const isOverLimit = overLimitClients.includes(c.id)
              return (
                <button key={c.id} onClick={() => toggleClient(c.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all text-left"
                  style={isSelected
                    ? { background: isOverLimit ? 'rgba(248,113,113,0.1)' : 'rgba(59,130,246,0.12)', borderColor: isOverLimit ? '#f8717155' : '#3b82f655', color: '#fff' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                    style={{ background: isSelected ? (isOverLimit ? '#f87171' : '#3b82f6') : 'transparent', borderColor: isSelected ? (isOverLimit ? '#f87171' : '#3b82f6') : 'rgba(255,255,255,0.2)' }}>
                    {isSelected && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="font-body text-[13px] flex-1">{c.name}</span>
                  {isOverLimit && <span className="font-display text-[9px] text-red-400">MAX RAGGIUNTO</span>}
                </button>
              )
            })}
          </div>
        </div>

        {overLimitClients.length > 0 && (
          <p className="font-body text-[12px] text-red-400/80 mb-4 m-0">
            {overLimitClients.length === 1 ? '1 cliente ha' : `${overLimitClients.length} clienti hanno`} raggiunto il massimale mensile. Rimuovili per procedere.
          </p>
        )}

        <button
          onClick={() => canSave && onSave({ date: selectedDate, startTime, endTime, clientIds: selectedClients, groupIds: selectedGroups })}
          disabled={!canSave}
          className="w-full rounded-xl py-3 font-display text-[12px] tracking-widest border-0 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}>
          {selectedClients.length === 0 ? 'SELEZIONA ALMENO UN CLIENTE' : `CREA SESSIONE (${selectedClients.length} clienti)`}
        </button>
      </div>
    </div>
  )
}

// ── RecurrenceModal ───────────────────────────────────────────────────────────
function RecurrenceModal({ clients, groups, onClose, onSave }) {
  const today    = new Date().toISOString().slice(0, 10)
  const inAMonth = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [selectedDays,    setSelectedDays]    = useState([])
  const [startDate,       setStartDate]       = useState(today)
  const [endDate,         setEndDate]         = useState(inAMonth)
  const [startTime,       setStartTime]       = useState('09:00')
  const [endTime,         setEndTime]         = useState('10:00')
  const [selectedClients, setSelectedClients] = useState([])
  const [selectedGroups,  setSelectedGroups]  = useState([])

  const toggleDay = (d) =>
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  const selectGroup = (group) => {
    setSelectedGroups(prev =>
      prev.includes(group.id) ? prev.filter(x => x !== group.id) : [...prev, group.id]
    )
    setSelectedClients(prev => { const next = new Set(prev); group.clientIds.forEach(id => next.add(id)); return [...next] })
  }

  const toggleClient = (id) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // Preview numero sessioni generate
  const previewCount = useMemo(() => {
    if (selectedDays.length === 0 || !startDate || !endDate) return 0
    return generateRecurrenceDates(startDate, endDate, selectedDays).length
  }, [selectedDays, startDate, endDate])

  const canSave = selectedDays.length > 0 && selectedClients.length > 0 && startDate && endDate

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display text-white text-[15px] m-0">Nuova ricorrenza</h3>
          <button onClick={onClose} className="bg-transparent border-none text-white/40 text-xl cursor-pointer">✕</button>
        </div>

        {/* Giorni settimana */}
        <div className="mb-4">
          <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-2">GIORNI DELLA SETTIMANA</label>
          <div className="flex gap-2 flex-wrap">
            {WEEK_DAYS.map(({ value, label }) => (
              <button key={value} onClick={() => toggleDay(value)}
                className="w-10 h-10 rounded-xl font-display text-[11px] cursor-pointer border transition-all"
                style={selectedDays.includes(value)
                  ? { background: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6', color: '#fff' }
                  : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date inizio/fine */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">DAL</label>
            <input type="date" value={startDate} min={today}
              onChange={e => setStartDate(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">AL</label>
            <input type="date" value={endDate} min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Orari */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">INIZIO</label>
            <input type="time" value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">FINE</label>
            <input type="time" value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Preview */}
        {previewCount > 0 && (
          <div className="rounded-xl p-3 mb-4"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="font-display text-[11px] text-blue-400">
              Verranno create {previewCount} sessioni
            </span>
          </div>
        )}

        {/* Gruppi */}
        {groups.length > 0 && (
          <div className="mb-4">
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-2">GRUPPO</label>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button key={g.id} onClick={() => selectGroup(g)}
                  className="rounded-xl px-3 py-1.5 font-display text-[11px] cursor-pointer border transition-all"
                  style={selectedGroups.includes(g.id)
                    ? { background: 'rgba(139,92,246,0.15)', borderColor: '#8b5cf655', color: '#a78bfa' }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clienti */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="font-display text-[10px] text-white/30 tracking-[2px]">CLIENTI</label>
            <button onClick={() => setSelectedClients(clients.map(c => c.id))}
              className="font-display text-[9px] text-white/30 cursor-pointer hover:text-white/50 bg-transparent border-none p-0">
              TUTTI
            </button>
          </div>
          <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
            {clients.map(c => (
              <button key={c.id} onClick={() => toggleClient(c.id)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all text-left"
                style={selectedClients.includes(c.id)
                  ? { background: 'rgba(59,130,246,0.12)', borderColor: '#3b82f655', color: '#fff' }
                  : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                <div className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                  style={{ background: selectedClients.includes(c.id) ? '#3b82f6' : 'transparent', borderColor: selectedClients.includes(c.id) ? '#3b82f6' : 'rgba(255,255,255,0.2)' }}>
                  {selectedClients.includes(c.id) && (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="font-body text-[12px]">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => canSave && onSave({ clientIds: selectedClients, groupIds: selectedGroups, days: selectedDays, startDate, endDate, startTime, endTime })}
          disabled={!canSave}
          className="w-full rounded-xl py-3 font-display text-[12px] tracking-widest border-0 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}>
          CREA RICORRENZA
        </button>
      </div>
    </div>
  )
}
