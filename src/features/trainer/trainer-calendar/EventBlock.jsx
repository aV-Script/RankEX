import { memo } from 'react'
import { SLOT_STATUS } from '../../../constants/slotStatus'

/**
 * Blocco evento nelle viste settimana e giorno.
 * Memoizzato — si aggiorna solo se slot, clients o onSelect cambiano.
 */
export const EventBlock = memo(function EventBlock({ slot, clients, onSelect, style }) {
  const statusColor = {
    [SLOT_STATUS.PLANNED]:   '#00c8ff',
    [SLOT_STATUS.COMPLETED]: '#34d399',
    [SLOT_STATUS.SKIPPED]:   '#6b7280',
  }[slot.status ?? SLOT_STATUS.PLANNED]

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
        background:  statusColor + '22',
        border:      `1px solid ${statusColor}55`,
        ...style,
      }}
    >
      <div className="font-display text-[10px] font-black leading-tight" style={{ color: statusColor }}>
        {slot.startTime}
      </div>
      <div className="font-body text-[11px] text-white/80 truncate leading-tight mt-0.5">
        {label}
      </div>
      {slot.recurrenceId && (
        <div className="font-display text-[8px] mt-0.5" style={{ color: statusColor + '88' }}>
          ↺
        </div>
      )}
    </button>
  )
})