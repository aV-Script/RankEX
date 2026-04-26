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

      {/* Destra — switcher + azioni */}
      <div className="flex items-center gap-2">

        {/* Switcher vista */}
        <div
          className="flex rounded-[3px] overflow-hidden border"
          style={{ background: 'rgba(13,21,32,0.9)', borderColor: 'rgba(15,214,90,0.12)' }}
        >
          {['month', 'week', 'day'].map(v => (
            <button
              key={v}
              onClick={() => onSetView(v)}
              aria-pressed={view === v}
              className="px-2.5 sm:px-4 py-1.5 font-display text-[11px] cursor-pointer transition-all border-none"
              style={view === v
                ? { background: 'rgba(15,214,90,0.15)', color: '#0fd65a' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }
              }
            >
              <span className="sm:hidden">
                {v === 'month' ? 'M' : v === 'week' ? 'S' : 'G'}
              </span>
              <span className="hidden sm:inline">
                {v === 'month' ? 'MESE' : v === 'week' ? 'SETTIMANA' : 'GIORNO'}
              </span>
            </button>
          ))}
        </div>

        {/* Azioni */}
        <button
          onClick={onNewRecurrence}
          aria-label="Nuova ricorrenza"
          className="rounded-[3px] px-2.5 sm:px-3 py-1.5 font-display text-[11px] tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
          style={{ background: 'rgba(15,214,90,0.12)', color: '#0fd65a', border: '1px solid rgba(15,214,90,0.2)' }}
        >
          <span className="sm:hidden">↺</span>
          <span className="hidden sm:inline">RICORRENZA</span>
        </button>
        <button
          onClick={onNewSlot}
          aria-label="Nuova sessione"
          className="rounded-[3px] px-2.5 sm:px-3 py-1.5 font-display text-[11px] tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
          style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', color: '#080c12' }}
        >
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">NUOVA SESSIONE</span>
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