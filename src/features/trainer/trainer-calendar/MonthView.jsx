import { useMemo, memo } from 'react'

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const STATUS_COLOR = {
  planned:   '#3b82f6',
  completed: '#34d399',
  skipped:   '#6b7280',
}

const MonthCell = memo(function MonthCell({ cell, clients, today, onSlotClick, onEmptyClick }) {
  const isToday = cell.dateStr === today
  return (
    <div
      className="rounded-xl min-h-[90px] flex flex-col cursor-pointer border transition-all"
      style={{
        background:  isToday ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
        borderColor: isToday ? 'rgba(59,130,246,0.3)'  : 'rgba(255,255,255,0.05)',
      }}
      onClick={() => onEmptyClick(cell.dateStr, '09:00')}
    >
      <div className="px-2 pt-2 pb-1">
        <span
          className={`font-display text-[13px] w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'text-white' : 'text-white/60'}`}
          style={isToday ? { background: '#3b82f6' } : {}}
        >
          {cell.day}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        {cell.slots.slice(0, 3).map(slot => {
          const statusColor = STATUS_COLOR[slot.status ?? 'planned']
          const clientNames = slot.clientIds
            .map(id => clients.find(c => c.id === id)?.name)
            .filter(Boolean)
          const label = clientNames.length === 1 ? clientNames[0] : `${clientNames.length} clienti`
          return (
            <button
              key={slot.id}
              onClick={(e) => { e.stopPropagation(); onSlotClick(slot, e) }}
              className="w-full text-left rounded-md px-1.5 py-0.5 font-body text-[10px] truncate cursor-pointer transition-all hover:opacity-80 border-none"
              style={{ background: statusColor + '22', color: statusColor }}
            >
              {slot.startTime} {label}
            </button>
          )
        })}
        {cell.slots.length > 3 && (
          <div className="font-display text-[9px] text-white/25 px-1.5">
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
          <div key={d} className="text-center font-display text-[10px] text-white/30 tracking-[2px] py-1">
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