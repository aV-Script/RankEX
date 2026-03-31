import { useMemo, useRef, useEffect }              from 'react'
import { HOUR_HEIGHT_PX as HOUR_H,
         computeSlotLayout }                       from '../../../utils/calendarUtils'
import { EventBlock }                              from './EventBlock'

const HOURS              = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES          = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const HOURS_COLUMN_WIDTH = 52  // px larghezza colonna ore

/**
 * Vista settimana — colonne orarie con eventi come blocchi posizionati.
 */
export function WeekView({ currentDate, slots, clients, today, onSlotClick, onEmptyClick }) {
  const scrollRef = useRef(null)

  // Scroll all'ora corrente al mount
  useEffect(() => {
    const hour = new Date().getHours()
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (hour - 1) * HOUR_H)
    }
  }, [])

  // Giorni della settimana
  const weekDays = useMemo(() => {
    const d      = new Date(currentDate + 'T12:00')
    const day    = d.getDay()
    const diff   = (day + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - diff)

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return date.toISOString().slice(0, 10)
    })
  }, [currentDate])

  // Slot per giorno
  const slotsByDate = useMemo(() => {
    const map = {}
    slots.forEach(s => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [slots])

  const now     = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const nowTop  = (nowMins / 60) * HOUR_H

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header giorni */}
      <div className="flex border-b border-white/[.05] shrink-0" style={{ paddingLeft: HOURS_COLUMN_WIDTH }}>
        {weekDays.map((dateStr, i) => {
          const d        = new Date(dateStr + 'T12:00')
          const isToday  = dateStr === today
          return (
            <div
              key={dateStr}
              className="flex-1 text-center py-3 border-l border-white/[.04]"
            >
              <div className="font-display text-[10px] text-white/30 tracking-[1px]">
                {DAY_NAMES[i]}
              </div>
              <div
                className={`font-display font-black text-[18px] mt-0.5 mx-auto w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isToday ? 'text-white' : 'text-white/60'}`}
                style={isToday ? { background: '#00c8ff' } : {}}
              >
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Griglia oraria */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: HOUR_H * 24 }}>

          {/* Colonna ore */}
          <div className="shrink-0 relative" style={{ width: HOURS_COLUMN_WIDTH }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 font-display text-[10px] text-white/20"
                style={{ top: h * HOUR_H - 7 }}
              >
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Colonne giorni */}
          {weekDays.map((dateStr) => {
            const daySlots = slotsByDate[dateStr] ?? []
            const layout   = computeSlotLayout(daySlots)
            const isToday  = dateStr === today

            return (
              <div
                key={dateStr}
                className="flex-1 relative border-l border-white/[.04]"
                style={{ background: isToday ? 'rgba(0,200,255,0.02)' : 'transparent' }}
                onClick={(e) => {
                  // Click su area vuota — calcola l'ora dal click
                  if (e.target === e.currentTarget) {
                    const rect     = e.currentTarget.getBoundingClientRect()
                    const y        = e.clientY - rect.top + scrollRef.current.scrollTop
                    const hour     = Math.floor(y / HOUR_H)
                    const minutes  = Math.round(((y % HOUR_H) / HOUR_H) * 60 / 15) * 15
                    const time     = `${String(hour).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`
                    onEmptyClick(dateStr, time)
                  }
                }}
              >
                {/* Linee orarie */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-white/[.04]"
                    style={{ top: h * HOUR_H }}
                  />
                ))}

                {/* Linea mezz'ora */}
                {HOURS.map(h => (
                  <div
                    key={`h-${h}`}
                    className="absolute left-0 right-0 border-t border-white/[.02]"
                    style={{ top: h * HOUR_H + HOUR_H / 2 }}
                  />
                ))}

                {/* Linea ora corrente */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <div className="relative flex items-center">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: '#ef4444', marginLeft: -4 }}
                      />
                      <div
                        className="flex-1 h-px"
                        style={{ background: '#ef4444' }}
                      />
                    </div>
                  </div>
                )}

                {/* Slot */}
                {daySlots.map(slot => {
                  const top    = timeToY(slot.startTime)
                  const height = Math.max(30, timeToY(slot.endTime) - top)
                  const { col, totalCols } = layout[slot.id] ?? { col: 0, totalCols: 1 }
                  const left  = `calc(${(col / totalCols) * 100}% + 4px)`
                  const width = `calc(${(1 / totalCols) * 100}% - 8px)`
                  return (
                    <EventBlock
                      key={slot.id}
                      slot={slot}
                      clients={clients}
                      onSelect={onSlotClick}
                      style={{ top, height, left, width, right: 'auto' }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function timeToY(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h + m / 60) * HOUR_H
}