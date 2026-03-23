import { useState, useEffect } from 'react'
import { calcSessionConfig } from '../../../utils/gamification'
/**
 * Modal per la chiusura di una sessione.
 * Il trainer marca le presenze — XP assegnata solo ai presenti.
 */
export function CloseSessionModal({ slot, clients, onClose, onConfirm }) {
  const slotClients = slot.clientIds
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean)

  const [attendees, setAttendees] = useState(slot.clientIds) // default tutti presenti

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const toggleAttendee = (id) =>
    setAttendees(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const absentCount  = slot.clientIds.length - attendees.length
  const presentCount = attendees.length

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-session-title"
        className="rounded-2xl p-6 w-full max-w-sm"
        style={{ background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5">
          <h3 id="close-session-title" className="font-display font-black text-[16px] text-white mb-1">
            Chiudi sessione
          </h3>
          <p className="font-body text-[13px] text-white/40 m-0">
            {slot.date} · {slot.startTime}
            {slot.endTime ? ` → ${slot.endTime}` : ''}
          </p>
        </div>

        {/* Lista presenze */}
        <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-3">
          PRESENZE
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {slotClients.map(client => {
            const isPresent = attendees.includes(client.id)
            return (
              <button
                key={client.id}
                onClick={() => toggleAttendee(client.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-all text-left"
                style={isPresent
                  ? { background: 'rgba(52,211,153,0.08)', borderColor: '#34d39944' }
                  : { background: 'rgba(248,113,113,0.06)', borderColor: '#f8717133' }
                }
              >
                {/* Icona presenza */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isPresent ? '#34d39922' : '#f8717122' }}
                >
                  <span style={{ color: isPresent ? '#34d399' : '#f87171', fontSize: 12 }}>
                    {isPresent ? '✓' : '✗'}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="font-body text-[13px] text-white/80">{client.name}</div>
                  <div
                    className="font-display text-[10px] mt-0.5"
                    style={{ color: isPresent ? '#34d399' : '#f87171' }}
                  >
                    {isPresent ? `+${calcXP(client)} XP` : 'Assente'}
                  </div>
                </div>

                <div
                  className="font-display text-[10px] shrink-0"
                  style={{ color: isPresent ? '#34d39988' : '#f8717188' }}
                >
                  {isPresent ? 'PRESENTE' : 'ASSENTE'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Riepilogo */}
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-[12px] text-emerald-400">
              {presentCount} presenti
            </span>
            {absentCount > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="font-display text-[12px] text-red-400">
                  {absentCount} assenti
                </span>
              </>
            )}
          </div>
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/70 transition-all"
          >
            ANNULLA
          </button>
          <button
            onClick={() => onConfirm(attendees)}
            disabled={presentCount === 0 && slotClients.length > 0}
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}
          >
            CHIUDI SESSIONE
          </button>
        </div>
      </div>
    </div>
  )
}

function calcXP(client) {
  const { xpPerSession } = calcSessionConfig(client.sessionsPerWeek ?? 3)
  return xpPerSession
}