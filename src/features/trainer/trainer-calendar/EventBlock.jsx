import { memo } from 'react'
import { SLOT_STATUS, SLOT_STATUS_COLORS } from '../../../constants/slotStatus'

/**
 * Blocco evento nelle viste settimana e giorno.
 * Memoizzato — si aggiorna solo se slot, clients o onSelect cambiano.
 */
export const EventBlock = memo(function EventBlock({ slot, clients, onSelect, style }) {
  const status = slot.status ?? SLOT_STATUS.PLANNED

  const statusColor = SLOT_STATUS_COLORS[status]

  const statusIcon = {
    [SLOT_STATUS.PLANNED]:   null,
    [SLOT_STATUS.COMPLETED]: '✓',
    [SLOT_STATUS.SKIPPED]:   '↷',
  }[status]

  const clientNames = slot.clientIds
    .map(id => clients.find(c => c.id === id)?.name)
    .filter(Boolean)

  const label = clientNames.length === 1
    ? clientNames[0]
    : `${clientNames.length} clienti`

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(slot, e) }}
      className="absolute left-1 right-1 rounded-[3px] px-2 py-1 text-left cursor-pointer transition-all hover:opacity-90 overflow-hidden"
      style={{
        background:  `color-mix(in srgb, ${statusColor} 13%, transparent)`,
        border:      `1px solid color-mix(in srgb, ${statusColor} 33%, transparent)`,
        ...style,
      }}
    >
      <div className="font-display text-[10px] font-black leading-tight flex items-center gap-1" style={{ color: statusColor }}>
        {statusIcon && <span aria-hidden="true">{statusIcon}</span>}
        {slot.startTime}
      </div>
      <div className="font-display font-bold text-[11px] text-white/80 truncate leading-tight mt-0.5">
        {label}
      </div>
      {slot.recurrenceId && (
        <div className="font-display text-[8px] mt-0.5" style={{ color: `color-mix(in srgb, ${statusColor} 53%, transparent)` }}>
          ↺
        </div>
      )}
    </button>
  )
})