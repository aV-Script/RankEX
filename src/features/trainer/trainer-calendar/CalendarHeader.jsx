import { Button } from '../../../components/ui'

const ACTION_PADDING = '6px 12px'

const MONTH_NAMES = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'
]

const VIEW_OPTS = [
  { id: 'month', label: 'M' },
  { id: 'week',  label: 'S' },
  { id: 'day',   label: 'G' },
]

/**
 * Header del calendario con navigazione, switcher vista e bottoni azioni.
 */
export function CalendarHeader({ currentDate, view, onNavigate, onToday, onViewChange, onAddSession, onAddRecurrence, terminology }) {
  const d     = new Date(currentDate + 'T12:00')
  const year  = d.getFullYear()
  const month = d.getMonth()

  const title = view === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : view === 'week'
    ? getWeekTitle(currentDate)
    : d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[.05] gap-x-2 sm:gap-x-3 shrink-0">

      {/* Sinistra — navigazione + titolo (a 360 px il titolo si accorcia con "…", D4) */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <button
          onClick={() => onNavigate(-1)}
          aria-label="Periodo precedente"
          className="w-8 h-8 rounded-[3px] flex items-center justify-center bg-transparent border border-[color-mix(in srgb, var(--rx-accent) 15%, transparent)] text-white/40 hover:text-white/70 hover:border-[color-mix(in srgb, var(--rx-accent) 35%, transparent)] transition-all cursor-pointer font-display text-[16px]"
        >
          ‹
        </button>
        <button
          onClick={onToday}
          aria-label="Vai a oggi"
          className="px-2.5 py-1.5 rounded-[3px] font-display text-[11px] cursor-pointer border border-[color-mix(in srgb, var(--rx-accent) 15%, transparent)] bg-transparent text-white/40 hover:text-white/70 transition-all"
        >
          OGGI
        </button>
        <button
          onClick={() => onNavigate(1)}
          aria-label="Periodo successivo"
          className="w-8 h-8 rounded-[3px] flex items-center justify-center bg-transparent border border-[color-mix(in srgb, var(--rx-accent) 15%, transparent)] text-white/40 hover:text-white/70 hover:border-[color-mix(in srgb, var(--rx-accent) 35%, transparent)] transition-all cursor-pointer font-display text-[16px]"
        >
          ›
        </button>
        <h2 className="font-display font-black text-[14px] sm:text-[18px] text-white ml-1 min-w-0 truncate" title={title}>{title}</h2>
      </div>

      {/* Destra — switcher vista + azioni */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Switcher Mese / Settimana / Giorno */}
        {onViewChange && (
          <div className="flex rounded-[3px] overflow-hidden border border-white/[.08]">
            {VIEW_OPTS.map(opt => (
              <button
                key={opt.id}
                onClick={() => onViewChange(opt.id)}
                aria-pressed={view === opt.id}
                className="px-2.5 py-1.5 font-display text-[10px] tracking-[1.5px] cursor-pointer border-none transition-all"
                style={{
                  background: view === opt.id ? 'color-mix(in srgb, var(--rx-accent) 15%, transparent)' : 'transparent',
                  color:      view === opt.id ? 'var(--rx-accent)' : 'rgba(200,212,224,0.35)',
                  borderRight: opt.id !== 'day' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* + Sessione */}
        {onAddSession && (
          <Button
            variant="primary"
            size="sm"
            padding={ACTION_PADDING}
            onClick={onAddSession}
            aria-label={`Aggiungi ${terminology.session.toLowerCase()}`}
            className="uppercase shrink-0 sm:!text-[10px]"
          >
            +<span className="hidden sm:inline"> {terminology.session}</span>
          </Button>
        )}

        {/* + Ricorrenza */}
        {onAddRecurrence && (
          <Button
            variant="neutral"
            size="sm"
            padding={ACTION_PADDING}
            onClick={onAddRecurrence}
            aria-label="Aggiungi ricorrenza"
            className="uppercase shrink-0 sm:!text-[10px]"
          >
            +<span className="hidden sm:inline"> Ricorrenza</span>
          </Button>
        )}

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