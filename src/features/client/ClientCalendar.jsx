import { useState, useEffect, useMemo } from 'react'
import { getClientSlots } from '../../firebase/services/calendar'
import { getMonthRange } from '../calendar/useCalendar'
import { useUpcomingSessions } from './useUpcomingSessions'
import { calcStreakPreview, calcSessionXP, calcStreakMultiplier } from '../../utils/gamification'
import {
  toLocalDateStr, getClientSlotState, calcClientMonthSummary, formatUpcomingDate,
} from '../../utils/calendarUtils'
import { bySessionGender, DEFAULT_TERMINOLOGY } from '../../config/modules.config'
import { upcomingSessionsTitle } from '../../utils/pluralLabels'
import { formatXpMultiplier } from '../../utils/clientHome'

const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const DAY_NAMES = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']

const UPCOMING_SHOWN = 3
const MAX_DAY_DOTS   = 3

const STATE_COLORS = {
  completed: '#34d399',
  absent:    '#f87171',
  skipped:   'rgba(255,255,255,0.35)',
  planned:   '#60a5fa',
}

const PANEL_STYLE = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }

const byTime = (a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')

// terminology: del modulo (vista trainer e area cliente); senza, default PT.
// client: serve per striscia e stima XP; senza, non compaiono.
// hasGamification: false per i moduli senza XP (lipedema): nessuna striscia né stima.
export function ClientCalendar({
  clientId, orgId, client = null, terminology = DEFAULT_TERMINOLOGY, hasGamification = true,
}) {
  const [slots,        setSlots]        = useState([])
  const [currentYear,  setCurrentYear]  = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)

  const { from, to } = getMonthRange(currentYear, currentMonth)
  const today = toLocalDateStr()

  // Ottieni i dati delle sessioni del client
  useEffect(() => {
    if (!orgId || !clientId) return
    // Cambiando mese velocemente, la risposta del mese precedente non deve
    // sovrascrivere quella del mese mostrato
    let cancelled = false
    getClientSlots(orgId, clientId, from, to)
      .then(data => { if (!cancelled) setSlots(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [orgId, clientId, from, to])

  // Prossime sessioni: indipendenti dal mese mostrato. In errore resta "nessuna in programma"
  const { sessions: upcomingSessions } = useUpcomingSessions(orgId, clientId)
  const upcoming = upcomingSessions.slice(0, UPCOMING_SHOWN)

  // Mappa dei giorni del mese per calendario
  const calendarDays = useMemo(() => {
    const firstDay    = new Date(currentYear, currentMonth - 1, 1)
    const lastDay     = new Date(currentYear, currentMonth, 0)
    const startOffset = (firstDay.getDay() + 6) % 7 // Lun = 0
    const days = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const daySlots = slots.filter(s => s.date === dateStr).sort(byTime)
      days.push({ day: d, dateStr, slots: daySlots })
    }
    return days
  }, [currentYear, currentMonth, slots])

  const { present, absent, pct } = calcClientMonthSummary(slots, clientId)
  const showStreak = hasGamification && Boolean(client)
  const streakMultiplier = showStreak ? calcStreakMultiplier(calcStreakPreview(client)) : 1

  const prevMonth = () => setCurrentMonth(m => { if (m === 1) { setCurrentYear(y => y-1); return 12 } return m-1 })
  const nextMonth = () => setCurrentMonth(m => { if (m === 12) { setCurrentYear(y => y+1); return 1 } return m+1 })

  const legend = [
    { state: 'completed', label: bySessionGender(terminology, 'Completato', 'Completata') },
    { state: 'absent',    label: 'Assente' },
    { state: 'skipped',   label: bySessionGender(terminology, 'Saltato', 'Saltata') },
    { state: 'planned',   label: bySessionGender(terminology, 'Pianificato', 'Pianificata') },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Prossime sessioni */}
      <div className="rounded-[3px] p-3.5" style={PANEL_STYLE}>
        <div className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] mb-2">
          {upcomingSessionsTitle(terminology)}
        </div>
        {upcoming.length === 0 ? (
          <p className="font-body text-[13px] text-white/40 m-0">
            {bySessionGender(terminology, 'Nessun', 'Nessuna')} {terminology.session.toLowerCase()} in programma
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
            {upcoming.map(slot => (
              <li key={slot.id} className="font-display text-[13px] font-semibold text-white/80">
                {formatUpcomingDate(slot.date)}
                {slot.startTime && ` · ${slot.startTime}${slot.endTime ? ` – ${slot.endTime}` : ''}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Navigazione */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} aria-label="Mese precedente"
          className="bg-transparent border border-white/10 rounded-[3px] w-8 h-8 flex items-center justify-center cursor-pointer hover:border-white/20 transition-all text-white/40 hover:text-white/70 text-[16px]">‹</button>
        <span className="font-display font-black text-[16px] text-white">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </span>
        <button onClick={nextMonth} aria-label="Mese successivo"
          className="bg-transparent border border-white/10 rounded-[3px] w-8 h-8 flex items-center justify-center cursor-pointer hover:border-white/20 transition-all text-white/40 hover:text-white/70 text-[16px]">›</button>
      </div>

      {/* Griglia */}
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center font-display text-[10px] font-semibold text-white/30 tracking-[1px] py-0.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} />
            const isToday   = cell.dateStr === today
            const hasSlots  = cell.slots.length > 0
            const states    = cell.slots.map(slot => getClientSlotState(slot, clientId))
            const mainState = states[0]

            // Stima XP: solo giorni con una sessione pianificata da oggi in poi
            const hasUpcomingPlanned = cell.dateStr >= today && states.includes('planned')
            const dayXP = showStreak && hasUpcomingPlanned
              ? calcSessionXP(client.baseXP ?? 50, calcStreakPreview(client))
              : 0

            return (
              <div key={cell.dateStr}
                className="rounded-[3px] flex flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] min-w-0"
                style={{
                  background: isToday ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${mainState === 'completed' ? '#34d39933' : isToday ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <span className="font-display text-[11px]"
                  style={{ color: isToday ? '#00c8ff' : mainState === 'completed' ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                  {cell.day}
                </span>
                {hasSlots && cell.slots[0].startTime && (
                  <span className="font-display text-[8px] text-white/60">{cell.slots[0].startTime}</span>
                )}
                {hasSlots && (
                  <div className="flex gap-0.5" aria-hidden="true">
                    {states.slice(0, MAX_DAY_DOTS).map((state, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full"
                        style={{ background: STATE_COLORS[state], opacity: state === 'planned' ? 0.6 : 1 }} />
                    ))}
                  </div>
                )}
                {hasSlots && (
                  <span className="sr-only">{legend.find(item => item.state === mainState)?.label}</span>
                )}
                {dayXP > 0 && (
                  <span className="font-display text-[8px] text-emerald-400">+{dayXP} XP</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {legend.map(item => (
          <div key={item.state} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full"
              style={{ background: STATE_COLORS[item.state], opacity: item.state === 'planned' ? 0.6 : 1 }} />
            <span className="font-display font-bold text-[11px] text-white/30">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Riepilogo mese */}
      <div className={`grid gap-2 ${showStreak ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="rounded-[3px] p-3.5 min-w-0" style={PANEL_STYLE}>
          <div className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] mb-1">PRESENZE</div>
          <div className="font-display text-[16px] font-black text-white">
            {present} / {present + absent}
            <span className="text-[12px] font-semibold text-white/50"> · {pct} %</span>
          </div>
        </div>
        {showStreak && (
          <div className="rounded-[3px] p-3.5 min-w-0" style={PANEL_STYLE}>
            <div className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] mb-1">STRISCIA</div>
            <div className="font-display text-[16px] font-black text-white">
              {client.sessionStreak ?? 0}
              <span className="text-[12px] font-semibold text-emerald-400">
                {' '}· {formatXpMultiplier(streakMultiplier)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
