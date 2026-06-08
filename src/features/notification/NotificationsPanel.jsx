// NotificationsPanel — drawer laterale notifiche cliente

// ── Icone per tipo ────────────────────────────────────────────────────────────

const ICON_BELL = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const TYPE_ICON = {
  session: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  xp: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  rank: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  default: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
}

// ── Formattazione data relativa ───────────────────────────────────────────────

function formatDate(raw) {
  if (!raw) return ''
  try {
    const d   = new Date(raw)
    const now = new Date()
    const diffMs   = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHrs  = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 2)  return 'Adesso'
    if (diffMins < 60) return `${diffMins} min fa`
    if (diffHrs  < 24) return `${diffHrs} ore fa`
    if (diffDays === 1) return 'Ieri'
    if (diffDays < 7)  return `${diffDays} giorni fa`
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  } catch {
    return raw
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function NotificationsPanel({ notifications, color, onClose, onDelete }) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col animate-in slide-in-from-right duration-300"
        style={{
          width:               'min(360px, 92vw)',
          background:          'var(--rx-nav-bg)',
          backdropFilter:      'blur(32px)',
          WebkitBackdropFilter:'blur(32px)',
          borderLeft:          '1px solid var(--rx-border)',
          boxShadow:           '-8px 0 48px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--rx-border)' }}>
          <div className="flex items-center justify-center rounded-[6px] shrink-0"
            style={{ width: 34, height: 34, background: color + '15', border: `1px solid ${color}30`, color }}>
            {ICON_BELL}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[6px] tracking-[3px] uppercase"
              style={{ color: color + '65' }}>
              {unreadCount > 0
                ? `${unreadCount} non ${unreadCount === 1 ? 'letta' : 'lette'}`
                : 'Tutte lette'}
            </div>
            <div className="font-display font-black uppercase text-white"
              style={{ fontSize: 12, letterSpacing: '1.5px' }}>
              Notifiche
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi notifiche"
            className="flex items-center justify-center cursor-pointer shrink-0"
            style={{ width: 32, height: 32, borderRadius: 6, background: 'color-mix(in srgb, var(--rx-green) 5%, transparent)', border: '1px solid var(--rx-border)', color: 'color-mix(in srgb, var(--rx-green) 45%, rgba(255,255,255,0.35))' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {notifications.length === 0 ? (

            // ── Empty state ──────────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center gap-3 h-full py-16">
              <div style={{ color: 'color-mix(in srgb, var(--rx-green) 25%, transparent)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div className="font-display font-black uppercase text-center"
                style={{ fontSize: 9, letterSpacing: '3px', color: 'color-mix(in srgb, var(--rx-green) 40%, transparent)' }}>
                Nessuna notifica
              </div>
            </div>

          ) : (

            // ── Notification cards ───────────────────────────────────────────
            <div className="px-4 py-3 flex flex-col gap-2">
              {notifications.map(n => {
                const isUnread = !n.read
                const icon     = TYPE_ICON[n.type] ?? TYPE_ICON.default
                return (
                  <div
                    key={n.id}
                    style={{
                      borderRadius: 8,
                      padding:      '11px 12px',
                      background:   isUnread ? color + '09' : 'color-mix(in srgb, var(--rx-green) 3%, transparent)',
                      border:       isUnread ? `1px solid ${color}25` : '1px solid var(--rx-border)',
                      borderLeft:   isUnread ? `3px solid ${color}` : `3px solid var(--rx-border)`,
                    }}
                  >
                    <div className="flex items-start gap-3">

                      {/* Icona tipo */}
                      <div className="flex items-center justify-center rounded-[5px] shrink-0 mt-0.5"
                        style={{
                          width: 28, height: 28,
                          background: isUnread ? color + '18' : 'color-mix(in srgb, var(--rx-green) 6%, transparent)',
                          color:      isUnread ? color        : 'color-mix(in srgb, var(--rx-green) 45%, transparent)',
                        }}>
                        {icon}
                      </div>

                      {/* Testo */}
                      <div className="flex-1 min-w-0">
                        <div className="font-body leading-snug"
                          style={{ fontSize: 13, color: isUnread ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.42)' }}>
                          {n.message}
                        </div>
                        <div className="font-display uppercase mt-1"
                          style={{ fontSize: 8, letterSpacing: '1px', color: 'color-mix(in srgb, var(--rx-green) 38%, transparent)' }}>
                          {formatDate(n.date)}
                        </div>
                      </div>

                      {/* Cancella */}
                      <button
                        onClick={() => onDelete(n.id)}
                        aria-label="Rimuovi notifica"
                        className="flex items-center justify-center cursor-pointer shrink-0 rounded-[4px] transition-all"
                        style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.18)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.10)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'transparent' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
