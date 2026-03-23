const MONTH_NAMES = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'
]

/**
 * Header del calendario con navigazione, switcher vista e bottoni azioni.
 */
export function CalendarHeader({ currentDate, view, onNavigate, onToday, onSetView, onNewSlot, onNewRecurrence }) {
  const d     = new Date(currentDate + 'T12:00')
  const year  = d.getFullYear()
  const month = d.getMonth()

  const title = view === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : view === 'week'
    ? getWeekTitle(currentDate)
    : d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05] flex-wrap gap-3">

      {/* Sinistra — navigazione */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate(-1)}
          aria-label="Periodo precedente"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all cursor-pointer font-display text-[16px]"
        >
          ‹
        </button>
        <button
          onClick={onToday}
          aria-label="Vai a oggi"
          className="px-3 py-1.5 rounded-lg font-display text-[11px] cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/70 transition-all"
        >
          OGGI
        </button>
        <button
          onClick={() => onNavigate(1)}
          aria-label="Periodo successivo"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all cursor-pointer font-display text-[16px]"
        >
          ›
        </button>
        <h2 className="font-display font-black text-[18px] text-white ml-2">{title}</h2>
      </div>

      {/* Centro — switcher vista */}
      <div
        className="flex rounded-xl overflow-hidden border border-white/10"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        {['month', 'week', 'day'].map(v => (
          <button
            key={v}
            onClick={() => onSetView(v)}
            aria-pressed={view === v}
            className="px-4 py-1.5 font-display text-[11px] cursor-pointer transition-all border-none"
            style={view === v
              ? { background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }
            }
          >
            {v === 'month' ? 'MESE' : v === 'week' ? 'SETTIMANA' : 'GIORNO'}
          </button>
        ))}
      </div>

      {/* Destra — azioni */}
      <div className="flex gap-2">
        <button
          onClick={onNewRecurrence}
          className="bg-transparent border border-white/10 rounded-xl px-3 py-1.5 text-white/40 font-display text-[11px] tracking-widest cursor-pointer hover:text-white/60 transition-all"
        >
          RICORRENZA
        </button>
        <button
          onClick={onNewSlot}
          className="rounded-xl px-4 py-2 font-display text-[11px] tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
        >
          NUOVA SESSIONE
        </button>
      </div>
    </div>
  )
}

function getWeekTitle(dateStr) {
  const d      = new Date(dateStr + 'T12:00')
  const day    = d.getDay()
  const diff   = (day + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} — ${fmt(sunday)}`
}