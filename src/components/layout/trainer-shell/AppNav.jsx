import { useRef } from 'react'
import { useTrainerState } from '../../../context/TrainerContext'
import { NAV_ITEMS, ORG_ADMIN_NAV_ITEMS, LogoutIcon } from './navItems.config'

export function AppNav({ page, onNavigate, onLogout }) {
  const { userRole } = useTrainerState()
  const allNavItems  = userRole === 'org_admin'
    ? [...NAV_ITEMS, ...ORG_ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  const activeIndex = allNavItems.findIndex(item => item.id === page)
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
    <>
      {/* ── Desktop — top nav bar ─────────────────────────────────────────── */}
      <header
        className="hidden lg:flex items-center border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md shrink-0 relative"
        style={{ background: 'rgba(7,9,14,0.92)', height: 48 }}
        aria-label="Navigazione principale"
      >
        {/* Logo — absolute left */}
        <span className="absolute left-4 top-1/2 -translate-y-1/2 rx-glow-text font-display font-black text-[15px]">
          RX
        </span>

        {/* Nav items — truly centered */}
        <nav className="flex items-center justify-center gap-0.5 w-full self-stretch">
          {allNavItems.map(item => {
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className="relative flex items-center gap-1.5 px-3 h-full cursor-pointer border-none bg-transparent font-display text-[11px] tracking-[1.5px] uppercase transition-colors"
                style={{ color: active ? '#0fd65a' : 'rgba(200,212,224,0.38)' }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.color = 'rgba(200,212,224,0.75)'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.color = 'rgba(200,212,224,0.38)'
                }}
              >
                {active && (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-sm"
                    style={{ background: 'linear-gradient(90deg,#0fd65a,#00c8ff)', boxShadow: '0 0 6px rgba(15,214,90,0.45)' }}
                  />
                )}
                <span style={{ display: 'flex', filter: active ? 'drop-shadow(0 0 4px rgba(15,214,90,0.5))' : 'none' }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Logout — absolute right */}
        <button
          onClick={onLogout}
          aria-label="Logout"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-[3px] bg-transparent border border-transparent hover:border-white/10 cursor-pointer transition-colors"
          style={{ color: 'rgba(200,212,224,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(200,212,224,0.7)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,212,224,0.3)' }}
        >
          {LogoutIcon}
        </button>
      </header>

      {/* ── Mobile — header + bottom tab bar ─────────────────────────────── */}
      <div className="lg:hidden flex-none">

        {/* Header top */}
        <header
          className="flex items-center justify-between px-4 py-3 border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md"
          style={{ background: 'rgba(7,9,14,0.92)' }}
          aria-label="Header mobile"
        >
          <div className="w-8" />
          <span className="rx-glow-text font-display font-black text-[17px]">RankEX</span>
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

        {/* Bottom tab bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/[.05] backdrop-blur-md"
          style={{ background: 'rgba(7,9,14,0.92)' }}
          aria-label="Navigazione mobile"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {allNavItems.map(item => {
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer relative border-none bg-transparent"
                style={{ color: active ? '#0fd65a' : 'rgba(200,212,224,0.3)', transition: 'color 150ms' }}
              >
                {active && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-2 right-2 h-[2px] rounded-b-sm"
                    style={{ background: 'linear-gradient(90deg,#0fd65a,#00c8ff)', boxShadow: '0 0 6px rgba(15,214,90,0.45)' }}
                  />
                )}
                <span style={{
                  display: 'flex',
                  filter:  active ? 'drop-shadow(0 0 6px rgba(15,214,90,0.5))' : 'none',
                }}>
                  {item.icon}
                </span>
                <span className="font-display text-[10px] tracking-[1px]">
                  {item.label.toUpperCase()}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
