import { useState, useEffect, useMemo } from 'react'
import { getClientSlots } from '../../firebase/services/calendar'
import { getMonthRange, calcMonthlyCompletion } from '../calendar/useCalendar'
import { calcSessionConfig, BONUS_XP_FULL_MONTH } from '../../utils/gamification'

const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const DAY_NAMES = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']

export function ClientCalendar({ clientId, sessionsPerWeek = 3 }) {
  const [slots,        setSlots]        = useState([])
  const [currentYear,  setCurrentYear]  = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)

  const { from, to } = getMonthRange(currentYear, currentMonth)
  const { xpPerSession, monthlySessions } = calcSessionConfig(sessionsPerWeek)

  useEffect(() => {
    if (!clientId) return
    getClientSlots(clientId, from, to).then(setSlots)
  }, [clientId, from, to])

  const calendarDays = useMemo(() => {
    const firstDay    = new Date(currentYear, currentMonth - 1, 1)
    const lastDay     = new Date(currentYear, currentMonth, 0)
    const startOffset = (firstDay.getDay() + 6) % 7
    const days = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      days.push({ day: d, dateStr, slots: slots.filter(s => s.date === dateStr) })
    }
    return days
  }, [currentYear, currentMonth, slots])

  const { planned, completed, pct } = calcMonthlyCompletion(slots, clientId)
  const today = new Date().toISOString().slice(0, 10)

  const prevMonth = () => setCurrentMonth(m => { if (m === 1) { setCurrentYear(y => y-1); return 12 } return m-1 })
  const nextMonth = () => setCurrentMonth(m => { if (m === 12) { setCurrentYear(y => y+1); return 1  } return m+1 })

  return (
    <div className="flex flex-col gap-4">
      {/* Navigazione */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth}
          className="bg-transparent border border-white/10 rounded-[3px] w-8 h-8 flex items-center justify-center cursor-pointer hover:border-white/20 transition-all text-white/40 hover:text-white/70 text-[16px]">‹</button>
        <span className="font-display font-black text-[15px] text-white">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </span>
        <button onClick={nextMonth}
          className="bg-transparent border border-white/10 rounded-[3px] w-8 h-8 flex items-center justify-center cursor-pointer hover:border-white/20 transition-all text-white/40 hover:text-white/70 text-[16px]">›</button>
      </div>

      {/* Barra completamento */}
      {planned > 0 && (
        <div className="rounded-[3px] p-3.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-display text-[10px] text-white/30 tracking-[2px]">COMPLETAMENTO MESE</span>
            <span className="font-display text-[12px]"
              style={{ color: pct === 100 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171' }}>
              {completed}/{planned}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${pct}%`, background: pct === 100 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171' }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-body text-[11px] text-white/30">{xpPerSession * completed} XP guadagnati</span>
            {pct === 100
              ? <span className="font-display text-[10px] text-emerald-400">+{BONUS_XP_FULL_MONTH} XP bonus!</span>
              : <span className="font-body text-[11px] text-white/20">Mese completo: +{BONUS_XP_FULL_MONTH} XP</span>
            }
          </div>
        </div>
      )}

      {/* Griglia */}
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center font-display text-[9px] text-white/25 tracking-[1px] py-0.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} />
            const isToday     = cell.dateStr === today
            const hasSlots    = cell.slots.length > 0
            const isCompleted = hasSlots && cell.slots.every(s => s.attendees?.includes(clientId))
            const isPlanned   = hasSlots && !isCompleted

            return (
              <div key={cell.dateStr}
                className="rounded-[3px] flex flex-col items-center justify-center gap-0.5 py-2 min-h-[44px]"
                style={{
                  background:  isCompleted ? '#34d39911' : isToday ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCompleted ? '#34d39933' : isToday ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <span className="font-display text-[11px]"
                  style={{ color: isCompleted ? '#34d399' : isToday ? '#00c8ff' : 'rgba(255,255,255,0.5)' }}>
                  {cell.day}
                </span>
                {hasSlots && cell.slots[0].startTime && (
                  <span className="font-display text-[8px] text-white/25">{cell.slots[0].startTime}</span>
                )}
                {isCompleted && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                {isPlanned   && <div className="w-1 h-1 rounded-full bg-blue-400 opacity-60" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-body text-[11px] text-white/30">Completata</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400 opacity-60" />
          <span className="font-body text-[11px] text-white/30">Pianificata</span>
        </div>
      </div>
    </div>
  )
}
