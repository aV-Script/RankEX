const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

/**
 * Griglia mensile del calendario.
 * Ogni cella mostra il giorno e le barre degli slot.
 */
export function CalendarGrid({ calendarDays, selectedDate, today, onSelectDate }) {
  return (
    <div>
      {/* Header giorni */}
      <div className="grid grid-cols-7 gap-1 mb-1">
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

          const isToday    = cell.dateStr === today
          const isSelected = cell.dateStr === selectedDate

          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(isSelected ? null : cell.dateStr)}
              className="rounded-xl p-1.5 min-h-[56px] flex flex-col items-center gap-1 cursor-pointer transition-all border"
              style={{
                background:  isSelected ? 'rgba(59,130,246,0.15)' : isToday ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                borderColor: isSelected ? '#3b82f6' : isToday ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <span
                className="font-display text-[12px]"
                style={{ color: isToday ? '#60a5fa' : isSelected ? '#fff' : 'rgba(255,255,255,0.6)' }}
              >
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
                          <div style={{
                            width:      `${slotTot > 0 ? Math.round(slotDone / slotTot * 100) : 0}%`,
                            height:     '100%',
                            background: allDone ? '#34d399' : '#f59e0b',
                          }} />
                        </div>
                        {s.startTime && (
                          <span className="font-display text-[8px] text-white/25 shrink-0">
                            {s.startTime}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {cell.slots.length > 2 && (
                    <span className="font-display text-[8px] text-white/25">
                      +{cell.slots.length - 2}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}