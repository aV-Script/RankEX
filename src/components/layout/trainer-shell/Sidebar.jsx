import { SidebarIcon } from './SidebarIcon'
import { NAV_ITEMS, LogoutIcon } from './nav.items.config'

/**
 * Sidebar desktop — icone con tooltip, logo, logout.
 * Sticky a sinistra, visibile solo su lg+.
 * onLogout viene dall'esterno — la sidebar non sa come funziona il logout.
 */
export function Sidebar({ page, onNavigate, onLogout }) {
  return (
    <aside
      className="
        hidden lg:flex flex-col items-center
        py-6 gap-2 sticky top-0 h-screen
        shrink-0 z-30 border-r border-white/[.05]
        backdrop-blur-md
      "
      style={{ width: 64 }}
      aria-label="Navigazione principale"
    >
      {/* Logo */}
      <div className="mb-4">
        <span
          className="font-display font-black text-[13px] leading-none"
          style={{
            background:           'linear-gradient(135deg, #60a5fa, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
          }}
        >
          FQ
        </span>
      </div>

      {/* Voci nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(item => (
          <SidebarIcon
            key={item.id}
            item={item}
            active={page === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={onLogout}
        aria-label="Logout"
        className="
          w-10 h-10 rounded-xl flex items-center justify-center
          cursor-pointer transition-all border border-transparent
          text-white/25 hover:text-white/60 hover:border-white/10
          bg-transparent
        "
      >
        {LogoutIcon}
      </button>
    </aside>
  )
}