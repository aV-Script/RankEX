import { useState, useMemo } from 'react'
import { generateRecurrenceDates } from '../../../firebase/services/calendar'

const WEEK_DAYS = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mer' },
  { value: 4, label: 'Gio' }, { value: 5, label: 'Ven' }, { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

/**
 * Modal per la creazione di una ricorrenza settimanale.
 */
export function RecurrenceModal({ clients, groups, onClose, onSave }) {
  const today    = new Date().toISOString().slice(0, 10)
  const inAMonth = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [selectedDays,    setSelectedDays]    = useState([])
  const [startDate,       setStartDate]       = useState(today)
  const [endDate,         setEndDate]         = useState(inAMonth)
  const [startTime,       setStartTime]       = useState('09:00')
  const [endTime,         setEndTime]         = useState('10:00')
  const [selectedClients, setSelectedClients] = useState([])
  const [selectedGroups,  setSelectedGroups]  = useState([])

  const toggleDay    = (d)  => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const toggleClient = (id) => setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

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

  const previewCount = useMemo(() => {
    if (selectedDays.length === 0 || !startDate || !endDate) return 0
    return generateRecurrenceDates(startDate, endDate, selectedDays).length
  }, [selectedDays, startDate, endDate])

  const canSave = selectedDays.length > 0 && selectedClients.length > 0 && startDate && endDate

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display text-white text-[15px] m-0">Nuova ricorrenza</h3>
          <button onClick={onClose} className="bg-transparent border-none text-white/40 text-xl cursor-pointer">✕</button>
        </div>

        {/* Giorni settimana */}
        <div className="mb-4">
          <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-2">GIORNI DELLA SETTIMANA</label>
          <div className="flex gap-2 flex-wrap">
            {WEEK_DAYS.map(({ value, label }) => (
              <button
                key={value} onClick={() => toggleDay(value)}
                className="w-10 h-10 rounded-xl font-display text-[11px] cursor-pointer border transition-all"
                style={selectedDays.includes(value)
                  ? { background: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6', color: '#fff' }
                  : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
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
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">FINE</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Preview */}
        {previewCount > 0 && (
          <div
            className="rounded-xl p-3 mb-4"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
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
                <button
                  key={g.id} onClick={() => selectGroup(g)}
                  className="rounded-xl px-3 py-1.5 font-display text-[11px] cursor-pointer border transition-all"
                  style={selectedGroups.includes(g.id)
                    ? { background: 'rgba(139,92,246,0.15)', borderColor: '#8b5cf655', color: '#a78bfa' }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                  }
                >
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
            <button
              onClick={() => setSelectedClients(clients.map(c => c.id))}
              className="font-display text-[9px] text-white/30 cursor-pointer hover:text-white/50 bg-transparent border-none p-0"
            >
              TUTTI
            </button>
          </div>
          <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
            {clients.map(c => (
              <button
                key={c.id} onClick={() => toggleClient(c.id)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all text-left"
                style={selectedClients.includes(c.id)
                  ? { background: 'rgba(59,130,246,0.12)', borderColor: '#3b82f655', color: '#fff' }
                  : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                }
              >
                <div
                  className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                  style={{
                    background:  selectedClients.includes(c.id) ? '#3b82f6' : 'transparent',
                    borderColor: selectedClients.includes(c.id) ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                  }}
                >
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
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          CREA RICORRENZA
        </button>
      </div>
    </div>
  )
}