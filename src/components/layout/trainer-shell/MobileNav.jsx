import { useRef } from 'react'
import { TabItem }        from './TabItem'
import { useTrainerState } from '../../../context/TrainerContext'
import { NAV_ITEMS, ORG_ADMIN_NAV_ITEMS, LogoutIcon } from './navItems.config'

export function MobileNav({ page, onNavigate, onLogout }) {
  const { userRole } = useTrainerState()
  const allNavItems  = userRole === 'org_admin'
    ? [...NAV_ITEMS, ...ORG_ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  const activeIndex = allNavItems.findIndex(item => item.id === page)
  const pillPct     = 100 / allNavItems.length
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy)) return
    const next = dx < 0
      ? allNavItems[activeIndex + 1]
      : allNavItems[activeIndex - 1]
    if (next) onNavigate(next.id)
  }

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding pill — scorre sull'icona attiva */}
        {activeIndex >= 0 && (
          <div
            aria-hidden="true"
            style={{
              position:   'absolute',
              top:        6,
              bottom:     6,
              left:       `calc(${activeIndex * pillPct}% + 6px)`,
              width:      `calc(${pillPct}% - 12px)`,
              borderRadius: 8,
              background: 'rgba(15,214,90,0.08)',
              border:     '1px solid rgba(15,214,90,0.16)',
              boxShadow:  '0 0 10px rgba(15,214,90,0.08)',
              transition: 'left 240ms cubic-bezier(0.34,1.56,0.64,1)',
              pointerEvents: 'none',
            }}
          />
        )}

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
