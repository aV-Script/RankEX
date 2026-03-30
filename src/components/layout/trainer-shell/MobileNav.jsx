import { TabItem }              from './TabItem'
import { NAV_ITEMS, LogoutIcon } from './navItems.config'

/**
 * Navigazione mobile — header fisso + tab bar.
 * onLogout viene dall'esterno per le stesse ragioni della Sidebar.
 */
export function MobileNav({ page, onNavigate, onLogout }) {
  return (
    <div className="lg:hidden flex-none">

      {/* Header */}
      <header
        className="
          flex items-center justify-between
          px-5 py-3 border-b border-white/[.05]
          sticky top-0 z-30 backdrop-blur-md
        "
        aria-label="Header mobile"
      >
        <span className="rx-glow-text font-display font-black text-[17px]">
          Rank EX
        </span>

        <button
          onClick={onLogout}
          aria-label="Logout"
          className="text-white/30 hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer"
        >
          {LogoutIcon}
        </button>
      </header>

      {/* Tab bar */}
      <nav
        className="flex border-b border-white/[.05] sticky top-[49px] z-20 backdrop-blur-md"
        aria-label="Navigazione mobile"
      >
        {NAV_ITEMS.map(item => (
          <TabItem
            key={item.id}
            item={item}
            active={page === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

    </div>
  )
}