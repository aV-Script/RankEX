import { logout }                from '../../../firebase/services/auth'
import { LogoutIcon, BellIcon } from './client.config'

/**
 * Shell layout dell'area cliente — header minimale + contenuto.
 * La navigazione è ora interna a ClientDashboardPage (tab orizzontali).
 */
export function ClientShell({ color, unreadCount, onOpenNotifs, children }) {
  return (
    <div className="min-h-screen text-white flex flex-col">

      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md shrink-0"
        style={{ background: 'rgba(7,9,14,0.72)' }}
        aria-label="Header"
      >
        <span className="rx-glow-text font-display font-black text-[17px]">
          RankEX
        </span>

        <div className="flex items-center gap-2">
          {/* Notifiche */}
          <button
            onClick={onOpenNotifs}
            aria-label="Notifiche"
            className="relative w-9 h-9 flex items-center justify-center cursor-pointer bg-transparent border-none"
            style={{ color: unreadCount > 0 ? color : 'rgba(255,255,255,0.4)' }}
          >
            {BellIcon}
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full font-display text-[9px] flex items-center justify-center text-white"
                style={{ background: color }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            aria-label="Logout"
            className="text-white/30 hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer"
          >
            {LogoutIcon}
          </button>
        </div>
      </header>

      {/* Contenuto principale */}
      <main className="flex-1 flex flex-col" aria-label="Contenuto principale">
        {children}
      </main>
    </div>
  )
}
