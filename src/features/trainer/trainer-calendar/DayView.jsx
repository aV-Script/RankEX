import { useRef, useEffect } from 'react'
import { EventBlock } from './EventBlock'

const HOURS  = Array.from({ length: 24 }, (_, i) => i)
const HOUR_H = 60

/**
 * Vista giorno — colonna oraria singola.
 */
export function DayView({ currentDate, slots, clients, today, onSlotClick, onEmptyClick }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const hour = new Date().getHours()
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (hour - 2) * HOUR_H)
    }
  }, [])

  const daySlots = slots.filter(s => s.date === currentDate)
  const isToday  = currentDate === today

  const now     = new Date()
  const nowTop  = (now.getHours() + now.getMinutes() / 60) * HOUR_H

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header giorno */}
      <div className="flex items-center justify-center py-4 border-b border-white/[.05] shrink-0">
        <div className="text-center">
          <div className="font-display text-[10px] text-white/30 tracking-[2px]">
            {new Date(currentDate + 'T12:00').toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase()}
          </div>
          <div
            className={`font-display font-black text-[32px] mt-1 w-14 h-14 mx-auto flex items-center justify-center rounded-full ${isToday ? 'text-white' : 'text-white/70'}`}
            style={isToday ? { background: '#3b82f6' } : {}}
          >
            {new Date(currentDate + 'T12:00').getDate()}
          </div>
        </div>
      </div>

      {/* Griglia oraria */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: HOUR_H * 24 }}>

          {/* Colonna ore */}
          <div className="shrink-0 relative" style={{ width: 52 }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 font-display text-[10px] text-white/20"
                style={{ top: h * HOUR_H - 7 }}
              >
                {h === 0 ? '' : `${String(h).padStart(2,'0')}:00`}
              </div>
            ))}
          </div>

          {/* Colonna eventi */}
          <div
            className="flex-1 relative border-l border-white/[.04]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                const rect    = e.currentTarget.getBoundingClientRect()
                const y       = e.clientY - rect.top + scrollRef.current.scrollTop
                const hour    = Math.floor(y / HOUR_H)
                const minutes = Math.round(((y % HOUR_H) / HOUR_H) * 60 / 15) * 15
                const time    = `${String(hour).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`
                onEmptyClick(currentDate, time)
              }
            }}
          >
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 border-t border-white/[.04]" style={{ top: h * HOUR_H }} />
            ))}
            {HOURS.map(h => (
              <div key={`h-${h}`} className="absolute left-0 right-0 border-t border-white/[.02]" style={{ top: h * HOUR_H + HOUR_H / 2 }} />
            ))}

            {/* Linea ora corrente */}
            {isToday && (
              <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowTop }}>
                <div className="relative flex items-center">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#ef4444', marginLeft: -4 }} />
                  <div className="flex-1 h-px" style={{ background: '#ef4444' }} />
                </div>
              </div>
            )}

            {/* Slot */}
            {daySlots.map(slot => {
              const top    = timeToY(slot.startTime)
              const height = Math.max(40, timeToY(slot.endTime) - top)
              return (
                <EventBlock
                  key={slot.id}
                  slot={slot}
                  clients={clients}
                  onSelect={onSlotClick}
                  style={{ top, height }}
                />
              )
            })}
          </div>
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