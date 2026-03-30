import { calcSessionConfig } from '../../../utils/gamification'
import { SLOT_STATUS } from '../../../constants/slotStatus'

const STATUS_COLORS = {
  [SLOT_STATUS.PLANNED]:   '#00c8ff',
  [SLOT_STATUS.COMPLETED]: '#34d399',
  [SLOT_STATUS.SKIPPED]:   '#6b7280',
}

const STATUS_LABELS = {
  [SLOT_STATUS.PLANNED]:   'PIANIFICATA',
  [SLOT_STATUS.COMPLETED]: 'COMPLETATA',
  [SLOT_STATUS.SKIPPED]:   'SALTATA',
}

/**
 * Card singolo slot nella vista giornaliera.
 * Il nuovo modello usa status + attendees + absentees.
 * Le azioni (chiudi, elimina) passano attraverso SlotPopup al click.
 */
export function SlotCard({ slot, clients, onClick }) {
  const status      = slot.status ?? SLOT_STATUS.PLANNED
  const statusColor = STATUS_COLORS[status]
  const statusLabel = STATUS_LABELS[status]

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[4px] p-4 mb-3 cursor-pointer transition-all hover:opacity-90"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border:     `1px solid ${statusColor}33`,
      }}
    >
      {/* Header slot */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {slot.startTime && (
            <span className="font-display text-[12px] text-white/60">
              {slot.startTime}{slot.endTime ? ` → ${slot.endTime}` : ''}
            </span>
          )}
          {slot.recurrenceId && (
            <span
              className="font-display text-[9px] px-2 py-0.5 rounded-[3px]"
              style={{ background: 'rgba(0,200,255,0.08)', color: '#00c8ff' }}
            >
              ↺ RICORRENTE
            </span>
          )}
        </div>

        <span
          className="font-display text-[9px] px-2 py-0.5 rounded-[3px]"
          style={{ background: statusColor + '22', color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Lista clienti */}
      <div className="flex flex-col gap-1.5">
        {slot.clientIds.map(clientId => {
          const client     = clients.find(c => c.id === clientId)
          const isPresent  = slot.attendees?.includes(clientId)
          const isAbsent   = slot.absentees?.includes(clientId)
          const xpPerSession = calcSessionConfig(client?.sessionsPerWeek ?? 3).xpPerSession

          return (
            <div
              key={clientId}
              className="flex items-center gap-2.5 rounded-[3px] px-3 py-2"
              style={{
                background: isPresent ? 'rgba(52,211,153,0.06)' :
                            isAbsent  ? 'rgba(248,113,113,0.06)' :
                            'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  isPresent ? '#34d39933' :
                  isAbsent  ? '#f8717133' :
                  'rgba(255,255,255,0.06)'
                }`,
              }}
            >
              {/* Indicatore presenza */}
              <span
                className="w-4 h-4 flex items-center justify-center shrink-0 text-[10px]"
                style={{
                  color: isPresent ? '#34d399' :
                         isAbsent  ? '#f87171' :
                         'rgba(255,255,255,0.2)',
                }}
              >
                {isPresent ? '✓' : isAbsent ? '✗' : '·'}
              </span>

              <span
                className="font-body text-[13px] flex-1"
                style={{
                  color: isPresent ? 'rgba(255,255,255,0.8)' :
                         isAbsent  ? 'rgba(255,255,255,0.3)' :
                         'rgba(255,255,255,0.7)',
                }}
              >
                {client?.name ?? '—'}
              </span>

              {isPresent && (
                <span className="font-display text-[10px] text-emerald-400">
                  +{xpPerSession} XP
                </span>
              )}
              {isAbsent && (
                <span className="font-display text-[10px] text-red-400/60">
                  Assente
                </span>
              )}
            </div>
          )
        })}
      </div>
    </button>
  )
}