import { useEffect, useRef } from 'react'
import { SLOT_STATUS } from '../../../constants/slotStatus'

/**
 * Popup dettaglio slot — appare al click su un evento.
 * Mostra info slot e azioni rapide.
 */
export function SlotPopup({ slot, clients, position, onClose, onDelete, onSkip, onCloseSession, onViewRecurrence }) {
  const ref = useRef(null)

  // Chiude al click fuori
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const slotClients = slot.clientIds
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean)

  const statusLabel = {
    [SLOT_STATUS.PLANNED]:   { text: 'PIANIFICATA', color: '#00c8ff' },
    [SLOT_STATUS.COMPLETED]: { text: 'COMPLETATA',  color: '#34d399' },
    [SLOT_STATUS.SKIPPED]:   { text: 'SALTATA',     color: '#6b7280' },
  }[slot.status ?? SLOT_STATUS.PLANNED]

  const isPast      = slot.date < new Date().toISOString().slice(0, 10)
  const isCompleted = slot.status === SLOT_STATUS.COMPLETED
  const isSkipped   = slot.status === SLOT_STATUS.SKIPPED

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 rounded-[4px] p-4 shadow-2xl"
      style={{
        background: '#0d1520',
        border:     '1px solid rgba(15,214,90,0.15)',
        top:        position.y,
        left:       position.x,
        maxWidth:   'calc(100vw - 32px)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-display font-black text-[14px] text-white">
            {slot.startTime}{slot.endTime ? ` → ${slot.endTime}` : ''}
          </div>
          <div className="font-body text-[12px] text-white/40 mt-0.5">
            {new Date(slot.date + 'T12:00').toLocaleDateString('it-IT', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-display text-[10px] px-2 py-0.5 rounded-[3px]"
            style={{ background: statusLabel.color + '22', color: statusLabel.color }}
          >
            {statusLabel.text}
          </span>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-white/30 cursor-pointer hover:text-white/60 transition-colors p-0 flex items-center justify-center w-6 h-6"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Clienti */}
      <div className="flex flex-col gap-1.5 mb-4">
        {slotClients.map(client => {
          const isPresent = slot.attendees?.includes(client.id)
          const isAbsent  = slot.absentees?.includes(client.id)
          return (
            <div
              key={client.id}
              className="flex items-center gap-2 px-3 py-2 rounded-[3px]"
              style={{
                background: isPresent ? 'rgba(52,211,153,0.06)' :
                            isAbsent  ? 'rgba(248,113,113,0.06)' :
                            'rgba(13,21,32,0.6)',
              }}
            >
              <span
                className="w-4 h-4 flex items-center justify-center text-[10px]"
                style={{
                  color: isPresent ? '#34d399' : isAbsent ? '#f87171' : 'rgba(255,255,255,0.3)',
                }}
              >
                {isPresent ? '✓' : isAbsent ? '✗' : '·'}
              </span>
              <span className="font-display font-bold text-[13px] text-white/80 flex-1">{client.name}</span>
              {isPresent && (
                <span className="font-display text-[10px] text-emerald-400">
                  +XP
                </span>
              )}
            </div>
          )
        })}
      </div>

      {slot.recurrenceId && (
        <button
          onClick={() => onViewRecurrence?.(slot.recurrenceId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] mb-4 w-full text-left cursor-pointer border transition-all hover:border-purple-400/30"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          <span className="font-display text-[10px] text-purple-400 flex-1">
            ↺ Sessione ricorrente
          </span>
          <span className="font-display text-[9px] text-purple-400/50">
            GESTISCI →
          </span>
        </button>
      )}

      {/* Azioni */}
      <div className="flex flex-col gap-2">
        {!isCompleted && !isSkipped && (
          <button
            onClick={onCloseSession}
            className="w-full py-2.5 rounded-[3px] font-display text-[11px] tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', color: '#080c12' }}
          >
            CHIUDI SESSIONE
          </button>
        )}

        {!isCompleted && !isSkipped && isPast && (
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-[3px] font-display text-[11px] cursor-pointer border bg-transparent transition-all hover:opacity-85"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            SEGNA COME SALTATA
          </button>
        )}

        <button
          onClick={onDelete}
          className="w-full py-2 rounded-[3px] font-display text-[11px] cursor-pointer border bg-transparent transition-all hover:opacity-85"
          style={{ borderColor: 'rgba(248,113,113,0.2)', color: '#f87171' }}
        >
          ELIMINA
        </button>
      </div>
    </div>
  )
}