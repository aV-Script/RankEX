import { useState, useMemo } from 'react'
import { Modal }        from '../../../components/ui'

/**
 * Modal per la creazione di una nuova sessione.
 */
export function AddSlotModal({ date, clients, groups, slots, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)

  const [selectedDate,    setSelectedDate]    = useState(date)
  const [startTime,       setStartTime]       = useState('09:00')
  const [endTime,         setEndTime]         = useState('10:00')
  const [selectedClients, setSelectedClients] = useState([])
  const [selectedGroups,  setSelectedGroups]  = useState([])

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

  // Verifica quanti clienti hanno raggiunto il limite mensile
  const overLimitClients = useMemo(() => {
    return selectedClients.filter(clientId => {
      const client = clients.find(c => c.id === clientId)
      if (!client) return false

      const year  = new Date(selectedDate).getFullYear()
      const month = new Date(selectedDate).getMonth() + 1
      const from  = `${year}-${String(month).padStart(2,'0')}-01`
      const to    = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`

      const planned = slots.filter(s =>
        s.clientIds.includes(clientId) && s.date >= from && s.date <= to
      ).length

      const maxMonthlySessions = client.maxMonthlySessions ?? 20
      return planned >= maxMonthlySessions
    })
  }, [selectedClients, clients, slots, selectedDate])

  const canSave = selectedClients.length > 0 && overLimitClients.length === 0

  return (
    <Modal title="Nuova sessione" onClose={onClose} size="default">
        {/* Data */}
        <div className="mb-4">
          <label htmlFor="add-slot-date" className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] block mb-1.5">DATA</label>
          <input
            id="add-slot-date"
            type="date" value={selectedDate} min={today}
            onChange={e => setSelectedDate(e.target.value)}
            className="input-base w-full" style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Orari */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="add-slot-start" className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] block mb-1.5">INIZIO</label>
            <input id="add-slot-start" type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label htmlFor="add-slot-end" className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] block mb-1.5">FINE</label>
            <input id="add-slot-end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Gruppi */}
        {groups.length > 0 && (
          <div className="mb-4">
            <label className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] block mb-2">GRUPPO</label>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button
                  key={g.id} onClick={() => selectGroup(g)}
                  className="rounded-[3px] px-3 py-1.5 font-display text-[11px] cursor-pointer border transition-all"
                  style={selectedGroups.includes(g.id)
                    ? { background: 'color-mix(in srgb, var(--rx-accent-2) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--rx-accent-2) 35%, transparent)', color: 'var(--rx-accent-2)' }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                  }
                >
                  {g.name} ({g.clientIds.length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clienti */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-display text-[11px] font-semibold text-white/30 tracking-[2px]">CLIENTI</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClients(clients.map(c => c.id))}
                className="font-display text-[10px] text-white/30 cursor-pointer hover:text-white/50 bg-transparent border-none p-0"
              >
                TUTTI
              </button>
              <span className="text-white/15">·</span>
              <button
                onClick={() => setSelectedClients([])}
                className="font-display text-[10px] text-white/30 cursor-pointer hover:text-white/50 bg-transparent border-none p-0"
              >
                NESSUNO
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
            {clients.map(c => {
              const isSelected  = selectedClients.includes(c.id)
              const isOverLimit = overLimitClients.includes(c.id)
              return (
                <button
                  key={c.id} onClick={() => toggleClient(c.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] cursor-pointer border transition-all text-left"
                  style={isSelected
                    ? { background: isOverLimit ? 'rgba(248,113,113,0.1)' : 'color-mix(in srgb, var(--rx-accent) 8%, transparent)', borderColor: isOverLimit ? '#f8717155' : 'color-mix(in srgb, var(--rx-accent) 35%, transparent)', color: '#fff' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }
                  }
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                    style={{
                      background:  isSelected ? (isOverLimit ? '#f87171' : 'var(--rx-accent)') : 'transparent',
                      borderColor: isSelected ? (isOverLimit ? '#f87171' : 'var(--rx-accent)') : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {isSelected && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="font-display font-bold text-[13px] flex-1">{c.name}</span>
                  {isOverLimit && <span className="font-display text-[10px] text-red-400">MAX RAGGIUNTO</span>}
                </button>
              )
            })}
          </div>
        </div>

        {overLimitClients.length > 0 && (
          <p role="alert" className="font-body text-[12px] text-red-400/80 mb-4 m-0">
            {overLimitClients.length === 1 ? '1 cliente ha' : `${overLimitClients.length} clienti hanno`} raggiunto il massimale mensile.
          </p>
        )}

        <button
          onClick={() => canSave && onSave({ date: selectedDate, startTime, endTime, clientIds: selectedClients, groupIds: selectedGroups })}
          disabled={!canSave}
          className="w-full py-3 font-display text-[12px] tracking-widest border-0 transition-opacity"
          style={{ background: 'color-mix(in srgb, var(--rx-accent) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-accent) 35%, transparent)', borderRadius: '3px', color: 'var(--rx-accent)', fontWeight: 700, opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          {selectedClients.length === 0 ? 'SELEZIONA ALMENO UN CLIENTE' : `CREA SESSIONE (${selectedClients.length} clienti)`}
        </button>
    </Modal>
  )
}