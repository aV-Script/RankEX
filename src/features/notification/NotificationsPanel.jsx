/**
 * NotificationsPanel — drawer laterale per le notifiche cliente.
 */
export function NotificationsPanel({ notifications, color, onClose, onDelete }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-sm h-full overflow-y-auto p-6
          border-l border-white/10
          animate-in slide-in-from-right duration-300
        "
        style={{ background: 'rgba(10,15,30,0.98)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-white text-[15px] m-0">Notifiche</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-white/40 text-xl cursor-pointer hover:text-white/70 transition-colors"
            aria-label="Chiudi notifiche"
          >
            ✕
          </button>
        </div>

        {/* Empty state */}
        {notifications.length === 0 && (
          <p className="text-white/20 font-body text-[13px] text-center py-8">
            Nessuna notifica.
          </p>
        )}

        {/* Lista notifiche */}
        {notifications.map(n => (
          <div
            key={n.id}
            className={`
              rounded-xl p-3.5 mb-2 border transition-all
              ${n.read
                ? 'border-white/[.05] bg-white/[.02]'
                : 'border-white/10 bg-white/[.05]'
              }
            `}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className={`font-body text-[13px] ${n.read ? 'text-white/50' : 'text-white'}`}>
                  {n.message}
                </div>
                <div className="text-white/20 font-body text-[11px] mt-1">{n.date}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                )}
                <button
                  onClick={() => onDelete(n.id)}
                  aria-label="Rimuovi notifica"
                  className="bg-transparent border-none text-white/20 cursor-pointer hover:text-red-400 transition-colors text-[14px] leading-none p-0"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}