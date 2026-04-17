import { TabItem }      from './TabItem'
import { useTrainerState } from '../../../context/TrainerContext'
import { NAV_ITEMS, ORG_ADMIN_NAV_ITEMS, LogoutIcon } from './navItems.config'

/**
 * Navigazione mobile — header fisso + tab bar.
 * onLogout viene dall'esterno per le stesse ragioni della Sidebar.
 */
export function MobileNav({ page, onNavigate, onLogout }) {
  const { userRole } = useTrainerState()
  const allNavItems  = userRole === 'org_admin'
    ? [...NAV_ITEMS, ...ORG_ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  return (
    <div className="lg:hidden flex-none">

      {/* Header */}
      <header
        className="flex items-center justify-center px-5 py-3 border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md"
        aria-label="Header mobile"
      >
        <span className="rx-glow-text font-display font-black text-[17px]">
          RankEX
        </span>
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