const MONTH_NAMES = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'
]

/**
 * Header del calendario con navigazione, switcher vista e bottoni azioni.
 */
export function CalendarHeader({ currentDate, view, onNavigate, onToday }) {
  const d     = new Date(currentDate + 'T12:00')
  const year  = d.getFullYear()
  const month = d.getMonth()

  const title = view === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : view === 'week'
    ? getWeekTitle(currentDate)
    : d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[.05] gap-y-2 gap-x-3 shrink-0">

      {/* Sinistra — navigazione + titolo */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onNavigate(-1)}
          aria-label="Periodo precedente"
          className="w-8 h-8 rounded-[3px] flex items-center justify-center bg-transparent border border-[rgba(15,214,90,0.15)] text-white/40 hover:text-white/70 hover:border-[rgba(15,214,90,0.35)] transition-all cursor-pointer font-display text-[16px]"
        >
          ‹
        </button>
        <button
          onClick={onToday}
          aria-label="Vai a oggi"
          className="px-2.5 py-1.5 rounded-[3px] font-display text-[11px] cursor-pointer border border-[rgba(15,214,90,0.15)] bg-transparent text-white/40 hover:text-white/70 transition-all"
        >
          OGGI
        </button>
        <button
          onClick={() => onNavigate(1)}
          aria-label="Periodo successivo"
          className="w-8 h-8 rounded-[3px] flex items-center justify-center bg-transparent border border-[rgba(15,214,90,0.15)] text-white/40 hover:text-white/70 hover:border-[rgba(15,214,90,0.35)] transition-all cursor-pointer font-display text-[16px]"
        >
          ›
        </button>
        <h2 className="font-display font-black text-[16px] sm:text-[18px] text-white ml-1">{title}</h2>
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