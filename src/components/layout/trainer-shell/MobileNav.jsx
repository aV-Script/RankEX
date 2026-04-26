import { TabItem }      from './TabItem'
import { useTrainerState } from '../../../context/TrainerContext'
import { NAV_ITEMS, ORG_ADMIN_NAV_ITEMS, LogoutIcon } from './navItems.config'

export function MobileNav({ page, onNavigate, onLogout }) {
  const { userRole } = useTrainerState()
  const allNavItems  = userRole === 'org_admin'
    ? [...NAV_ITEMS, ...ORG_ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  return (
    <div className="lg:hidden flex-none">

      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(7,9,14,0.92)' }}
        aria-label="Header mobile"
      >
        <div className="w-8" />
        <span className="rx-glow-text font-display font-black text-[17px]">
          RankEX
        </span>
        <button
          onClick={onLogout}
          aria-label="Logout"
          className="w-8 h-8 flex items-center justify-center rounded-[3px] bg-transparent border-none cursor-pointer transition-colors"
          style={{ color: 'rgba(200,212,224,0.3)' }}
          onTouchStart={e => { e.currentTarget.style.color = 'rgba(200,212,224,0.7)' }}
          onTouchEnd={e => { e.currentTarget.style.color = 'rgba(200,212,224,0.3)' }}
        >
          {LogoutIcon}
        </button>
      </header>

      {/* Tab bar — footer fisso */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/[.05] backdrop-blur-md"
        style={{ background: 'rgba(7,9,14,0.92)' }}
        aria-label="Navigazione mobile"
      >
        {allNavItems.map(item => (
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