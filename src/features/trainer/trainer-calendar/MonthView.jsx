import { useMemo, memo } from 'react'
import { SLOT_STATUS, SLOT_STATUS_COLORS as STATUS_COLOR } from '../../../constants/slotStatus'

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const MonthCell = memo(function MonthCell({ cell, clients, today, onSlotClick, onEmptyClick }) {
  const isToday = cell.dateStr === today
  return (
    // Il click su area vuota resta un'affordance mouse-only: l'accesso da
    // tastiera passa dal bottone "+" dedicato qui sotto, per evitare di
    // annidare i bottoni-slot dentro un contenitore anch'esso role="button"
    // (struttura ARIA non valida — vedi RX-34).
    <div
      className="rounded-[4px] min-h-[90px] flex flex-col border transition-all"
      style={{
        background:  isToday ? 'color-mix(in srgb, var(--rx-accent-2) 5%, transparent)' : 'var(--rx-card-bg)',
        borderColor: isToday ? 'color-mix(in srgb, var(--rx-accent-2) 30%, transparent)'  : 'color-mix(in srgb, var(--rx-accent) 6%, transparent)',
      }}
      onClick={() => onEmptyClick(cell.dateStr, '09:00')}
    >
      <div className="px-2 pt-2 pb-1 flex items-center justify-between">
        <span
          className={`font-display text-[13px] w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'text-white' : 'text-white/60'}`}
          style={isToday ? { background: 'var(--rx-accent-2)' } : {}}
        >
          {cell.day}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onEmptyClick(cell.dateStr, '09:00') }}
          aria-label={`Aggiungi sessione il ${cell.dateStr}`}
          className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer border-none bg-transparent text-white/25 hover:text-white/60 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        {cell.slots.slice(0, 3).map(slot => {
          const statusColor = STATUS_COLOR[slot.status ?? SLOT_STATUS.PLANNED]
          const clientNames = slot.clientIds
            .map(id => clients.find(c => c.id === id)?.name)
            .filter(Boolean)
          const label = clientNames.length === 1 ? clientNames[0] : `${clientNames.length} clienti`
          return (
            <button
              key={slot.id}
              onClick={(e) => { e.stopPropagation(); onSlotClick(slot, e) }}
              className="w-full text-left rounded-[3px] px-1.5 py-0.5 font-body text-[10px] truncate cursor-pointer transition-all hover:opacity-80 border-none"
              style={{ background: statusColor + '22', color: statusColor }}
            >
              {slot.startTime} {label}
            </button>
          )
        })}
        {cell.slots.length > 3 && (
          <div className="font-display text-[9px] text-white/60 px-1.5">
            +{cell.slots.length - 3} altri
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Vista mese — griglia con eventi visibili nelle celle.
 */
export function MonthView({ currentDate, slots, clients, today, onSlotClick, onEmptyClick }) {
  const d     = new Date(currentDate + 'T12:00')
  const year  = d.getFullYear()
  const month = d.getMonth()

  const slotsByDate = useMemo(() => {
    const map = {}
    slots.forEach(s => { if (!map[s.date]) map[s.date] = []; map[s.date].push(s) })
    return map
  }, [slots])

  const calendarDays = useMemo(() => {
    const firstDay    = new Date(year, month, 1)
    const lastDay     = new Date(year, month + 1, 0)
    const startOffset = (firstDay.getDay() + 6) % 7
    const days        = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let dd = 1; dd <= lastDay.getDate(); dd++) {
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(dd).padStart(2,'0')}`
      days.push({ day: dd, dateStr, slots: slotsByDate[dateStr] ?? [] })
    }
    return days
  }, [year, month, slotsByDate])

  return (
    <div className="flex-1 px-4 py-4 overflow-y-auto">

      {/* Header giorni */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center font-display text-[11px] font-semibold text-white/30 tracking-[2px] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Griglia */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} />
          return (
            <MonthCell
              key={cell.dateStr}
              cell={cell}
              clients={clients}
              today={today}
              onSlotClick={onSlotClick}
              onEmptyClick={onEmptyClick}
            />
          )
        })}
      </div>
    </div>
  )
}