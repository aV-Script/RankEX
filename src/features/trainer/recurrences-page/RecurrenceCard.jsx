const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

const STATUS_COLORS = {
  active:    '#0fd65a',
  ended:     '#6b7280',
  cancelled: '#f87171',
}

export function RecurrenceCard({ recurrence, clients, onClick }) {
  const status      = recurrence.status ?? 'active'
  const statusColor = STATUS_COLORS[status]

  const clientNames = recurrence.clientIds
    .slice(0, 3)
    .map(id => clients.find(c => c.id === id)?.name)
    .filter(Boolean)

  const dayLabels = DAY_LABELS.filter((_, i) => recurrence.days.includes(i))
  const isExpired = recurrence.endDate < new Date().toISOString().slice(0, 10)

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 cursor-pointer border transition-all hover:opacity-90"
      style={{
        background:   'rgba(13,21,32,0.9)',
        borderColor:  'rgba(15,214,90,0.12)',
        borderRadius: '4px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background   = 'rgba(15,214,90,0.04)'
        e.currentTarget.style.borderColor  = 'rgba(15,214,90,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background   = 'rgba(13,21,32,0.9)'
        e.currentTarget.style.borderColor  = 'rgba(15,214,90,0.12)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        {/* Giorni */}
        <div className="flex gap-1 flex-wrap">
          {dayLabels.map(d => (
            <span
              key={d}
              className="font-display text-[10px] px-2 py-0.5 rounded-[3px]"
              style={{ background: statusColor + '18', color: statusColor }}
            >
              {d}
            </span>
          ))}
        </div>
        {/* Orario */}
        <span className="font-display text-[12px] text-white/50 shrink-0 ml-2">
          {recurrence.startTime} → {recurrence.endTime}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Clienti */}
        <div className="font-display font-bold text-[12px] text-white/50">
          {clientNames.length > 0
            ? clientNames.join(', ') + (recurrence.clientIds.length > 3 ? ` +${recurrence.clientIds.length - 3}` : '')
            : 'Nessun cliente'
          }
        </div>

        {/* Periodo + scaduta */}
        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] text-white/25">
            {recurrence.startDate} → {recurrence.endDate}
          </span>
          {isExpired && status === 'active' && (
            <span
              className="font-display text-[10px] font-semibold px-2 py-0.5 rounded-[3px]"
              style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}
            >
              SCADUTA
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
