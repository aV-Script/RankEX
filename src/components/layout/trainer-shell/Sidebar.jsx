import { SidebarIcon }   from './SidebarIcon'
import { useTrainerState } from '../../../context/TrainerContext'
import { NAV_ITEMS, ORG_ADMIN_NAV_ITEMS, LogoutIcon } from './navItems.config'

/**
 * Sidebar desktop — icone con tooltip, logo, logout.
 * Sticky a sinistra, visibile solo su lg+.
 * onLogout viene dall'esterno — la sidebar non sa come funziona il logout.
 */
export function Sidebar({ page, onNavigate, onLogout }) {
  const { userRole }  = useTrainerState()
  const allNavItems   = userRole === 'org_admin'
    ? [...NAV_ITEMS, ...ORG_ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  return (
    <aside
      className="
        hidden lg:flex flex-col items-center
        py-6 gap-2 sticky top-0 h-screen
        shrink-0 z-30 border-r border-white/[.05]
        backdrop-blur-md bg-black/50
      "
      style={{ width: 64 }}
      aria-label="Navigazione principale"
    >
      {/* Logo */}
      <div className="mb-4">
        <span className="rx-glow-text font-display font-black text-[16px] leading-none tracking-wider">
          RX
        </span>
      </div>

      {/* Voci nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {allNavItems.map(item => (
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
          w-10 h-10 rounded-[3px] flex items-center justify-center
          cursor-pointer transition-all border border-transparent
          text-white/25 hover:text-white/60
          bg-transparent
        "
      >
        {LogoutIcon}
      </button>
    </aside>
  )
}