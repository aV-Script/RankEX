import { logout }                        from '../../../firebase/services/auth'
import { NAV_ITEMS, LogoutIcon, BellIcon } from './client.config'

/**
 * Shell layout dell'area cliente.
 * Sidebar desktop + header mobile + tab bar.
 * Segue lo stesso pattern di TrainerShell.
 */
export function ClientShell({ activePage, onNavigate, color, unreadCount, onOpenNotifs, children }) {
  return (
    <div className="min-h-screen text-white flex flex-col lg:flex-row">

      {/* Sidebar desktop */}
      <aside
        className="hidden lg:flex flex-col items-center py-6 gap-2 sticky top-0 h-screen shrink-0 z-30 border-r border-white/[.05] backdrop-blur-md"
        style={{ width: 64 }}
        aria-label="Navigazione principale"
      >
        {/* Logo */}
        <div className="mb-4">
          <span className="rx-glow-text font-display font-black text-[14px] leading-none tracking-wider">
            RX
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onNavigate(item.id)}
                data-active={activePage === item.id}
                aria-label={item.label}
                aria-current={activePage === item.id ? 'page' : undefined}
                className="
                  w-10 h-10 rounded-[3px] flex items-center justify-center
                  cursor-pointer transition-all border
                  text-white/35 border-transparent
                  hover:bg-white/[.07] hover:border-white/10 hover:text-white/75
                  data-[active=true]:bg-rx-green/[.1] data-[active=true]:border-rx-green/40 data-[active=true]:text-rx-green
                "
              >
                {item.icon}
              </button>

              {/* Tooltip */}
              <div className="
                absolute left-[52px] top-1/2 -translate-y-1/2
                pointer-events-none opacity-0 group-hover:opacity-100
                transition-opacity duration-150 z-50
                rounded-[3px] px-2.5 py-1.5 whitespace-nowrap
              "
              style={{ background: 'rgba(8,12,18,0.97)', border: '1px solid rgba(15,214,90,0.2)' }}
              >
                <span className="font-display text-[11px] tracking-[1px]" style={{ color: '#0fd65a' }}>
                  {item.label.toUpperCase()}
                </span>
                <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45" style={{ background: 'rgba(8,12,18,0.97)', borderLeft: '1px solid rgba(15,214,90,0.2)', borderBottom: '1px solid rgba(15,214,90,0.2)' }} />
              </div>
            </div>
          ))}
        </nav>

        {/* Notifiche */}
        <button
          onClick={onOpenNotifs}
          aria-label="Notifiche"
          className="relative w-10 h-10 rounded-[3px] flex items-center justify-center cursor-pointer transition-all border border-transparent hover:border-white/10"
          style={{ color: unreadCount > 0 ? color : 'rgba(255,255,255,0.35)' }}
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
          className="w-10 h-10 rounded-[3px] flex items-center justify-center cursor-pointer transition-all border border-transparent hover:border-white/10 text-white/25 hover:text-white/60 bg-transparent"
        >
          {LogoutIcon}
        </button>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden flex-none">
        <header
          className="flex items-center justify-between px-5 py-3 border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md"
          aria-label="Header mobile"
        >
          <span className="rx-glow-text font-display font-black text-[17px]">
            Rank X
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNotifs}
              className="relative w-9 h-9 flex items-center justify-center"
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
            <button
              onClick={logout}
              className="text-white/30 hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer"
              aria-label="Logout"
            >
              {LogoutIcon}
            </button>
          </div>
        </header>

        {/* Tab bar */}
        <nav
          className="flex border-b border-white/[.05] sticky top-[49px] z-20 backdrop-blur-md"
          aria-label="Navigazione mobile"
        >
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-active={activePage === item.id}
              aria-label={item.label}
              aria-current={activePage === item.id ? 'page' : undefined}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer transition-all relative border-none bg-transparent"
            >
              {activePage === item.id && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #0fd65a, #00c8ff)', boxShadow: '0 0 8px rgba(15,214,90,0.5)' }}
                />
              )}
              <span
                data-active={activePage === item.id}
                className="data-[active=true]:text-rx-green text-white/30 transition-colors"
              >
                {item.icon}
              </span>
              <span
                data-active={activePage === item.id}
                className="font-display text-[9px] tracking-[0.5px] data-[active=true]:text-rx-green text-white/30 transition-colors"
              >
                {item.label.toUpperCase()}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenuto */}
      <main className="flex-1 min-w-0" aria-label="Contenuto principale">
        {children}
      </main>
    </div>
  )
}