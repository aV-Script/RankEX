import { logout } from '../../firebase/services/auth'

const ADMIN_COLOR = '#f87171'

const NAV_ITEMS = [
  {
    id:    'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id:    'orgs',
    label: 'Organizzazioni',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id:    'profile',
    label: 'Profilo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

const LogoutIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

/**
 * Shell dell'area super_admin.
 * Sidebar desktop (64px) + header/tab mobile.
 * Accent rosso per distinguerla dall'area trainer.
 */
export function AdminShell({ page, onNavigate, children }) {
  return (
    <div className="min-h-screen text-white flex flex-col lg:flex-row" style={{ background: 'var(--bg-base, #07090e)' }}>

      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col items-center py-6 gap-2 sticky top-0 h-screen shrink-0 z-30 border-r border-white/[.05] backdrop-blur-md"
        style={{ width: 64 }}
      >
        {/* Logo */}
        <div className="mb-2 flex flex-col items-center gap-1">
          <span className="font-display font-black text-[14px] leading-none tracking-wider" style={{ color: ADMIN_COLOR }}>
            RX
          </span>
          <span
            className="font-display text-[7px] px-1.5 py-0.5 rounded-[2px] tracking-widest"
            style={{ background: `${ADMIN_COLOR}18`, color: ADMIN_COLOR }}
          >
            SA
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-1 flex-1 mt-2">
          {NAV_ITEMS.map(item => (
            <AdminSidebarIcon
              key={item.id}
              item={item}
              active={page === item.id}
              onClick={() => onNavigate(item.id)}
              color={ADMIN_COLOR}
            />
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          aria-label="Logout"
          className="w-10 h-10 rounded-[3px] flex items-center justify-center cursor-pointer transition-all border border-transparent bg-transparent text-white/25 hover:text-white/60"
        >
          {LogoutIcon}
        </button>
      </aside>

      {/* ── Mobile header + tab bar ──────────────────────────────────── */}
      <div className="lg:hidden flex-none">
        <header
          className="flex items-center justify-between px-5 py-3 border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-[16px]" style={{ color: ADMIN_COLOR }}>
              RankEX
            </span>
            <span
              className="font-display text-[8px] px-1.5 py-0.5 rounded-[2px]"
              style={{ background: `${ADMIN_COLOR}18`, color: ADMIN_COLOR }}
            >
              SUPER ADMIN
            </span>
          </div>
          <button
            onClick={logout}
            aria-label="Logout"
            className="text-white/30 hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer"
          >
            {LogoutIcon}
          </button>
        </header>

        <nav className="flex border-b border-white/[.05] sticky top-[49px] z-20 backdrop-blur-md">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 bg-transparent border-none cursor-pointer transition-all"
              style={page === item.id
                ? { color: ADMIN_COLOR, borderBottom: `2px solid ${ADMIN_COLOR}` }
                : { color: 'rgba(255,255,255,0.25)', borderBottom: '2px solid transparent' }
              }
            >
              {item.icon}
              <span className="font-display text-[8px] tracking-wider">{item.label.toUpperCase()}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Contenuto ───────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0">
        {children}
      </main>

    </div>
  )
}

function AdminSidebarIcon({ item, active, onClick, color }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className="w-10 h-10 flex items-center justify-center cursor-pointer transition-all"
        style={active ? {
          background:   `${color}18`,
          border:       `1px solid ${color}55`,
          borderRadius: '4px',
          color,
          boxShadow:    `0 0 12px ${color}25`,
        } : {
          background:   'transparent',
          border:       '1px solid transparent',
          borderRadius: '4px',
          color:        'rgba(200,212,224,0.3)',
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.borderColor = `${color}33`
            e.currentTarget.style.color       = `${color}cc`
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.color       = 'rgba(200,212,224,0.3)'
          }
        }}
      >
        {item.icon}
      </button>

      {/* Tooltip */}
      <div className="absolute left-[52px] top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 px-2.5 py-1.5 whitespace-nowrap"
        style={{
          background:   'rgba(8,12,18,0.97)',
          border:       `1px solid ${color}33`,
          borderRadius: '3px',
          boxShadow:    '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <span className="font-display text-[10px] tracking-[2px]" style={{ color }}>
          {item.label.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
