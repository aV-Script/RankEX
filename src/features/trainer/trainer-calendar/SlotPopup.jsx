import { useEffect, useRef } from 'react'

/**
 * Popup dettaglio slot — appare al click su un evento.
 * Mostra info slot e azioni rapide.
 */
export function SlotPopup({ slot, clients, position, onClose, onDelete, onSkip, onCloseSession }) {
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
    planned:   { text: 'PIANIFICATA', color: '#60a5fa' },
    completed: { text: 'COMPLETATA',  color: '#34d399' },
    skipped:   { text: 'SALTATA',     color: '#6b7280' },
  }[slot.status ?? 'planned']

  const isPast      = slot.date < new Date().toISOString().slice(0, 10)
  const isCompleted = slot.status === 'completed'
  const isSkipped   = slot.status === 'skipped'

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 rounded-2xl p-4 shadow-2xl"
      style={{
        background: 'rgba(10,15,30,0.98)',
        border:     '1px solid rgba(255,255,255,0.12)',
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
            className="font-display text-[9px] px-2 py-0.5 rounded-md"
            style={{ background: statusLabel.color + '22', color: statusLabel.color }}
          >
            {statusLabel.text}
          </span>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-white/30 cursor-pointer hover:text-white/60 transition-colors text-[16px] leading-none p-0"
          >
            ✕
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: isPresent ? 'rgba(52,211,153,0.06)' :
                            isAbsent  ? 'rgba(248,113,113,0.06)' :
                            'rgba(255,255,255,0.03)',
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
              <span className="font-body text-[13px] text-white/70 flex-1">{client.name}</span>
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
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-4"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          <span className="font-display text-[10px] text-purple-400">↺ Sessione ricorrente</span>
        </div>
      )}

      {/* Azioni */}
      <div className="flex flex-col gap-2">
        {!isCompleted && !isSkipped && (
          <button
            onClick={onCloseSession}
            className="w-full py-2.5 rounded-xl font-display text-[11px] tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}
          >
            CHIUDI SESSIONE
          </button>
        )}

        {!isCompleted && !isSkipped && isPast && (
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-xl font-display text-[11px] cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/60 transition-all"
          >
            SEGNA COME SALTATA
          </button>
        )}

        <button
          onClick={onDelete}
          className="w-full py-2 rounded-xl font-display text-[11px] cursor-pointer border border-red-500/20 bg-transparent text-red-400/50 hover:text-red-400 hover:border-red-500/40 transition-all"
        >
          ELIMINA
        </button>
      </div>
    </div>
  )
}