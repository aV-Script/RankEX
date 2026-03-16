/**
 * TrainerShell — layout wrapper per tutta l'area trainer.
 *
 * Desktop: sidebar sinistra con icone (64px), label tooltip al hover.
 *          Logo FITQUEST in cima, voci di nav al centro, logout in fondo.
 *
 * Mobile:  header fisso con logo + logout in alto,
 *          tab bar con icone + label in cima sotto l'header (stile Twitter/X).
 */

import { logout } from '../../firebase/services'

// ── Icone SVG inline ──────────────────────────────────────────────────────────
const Icons = {
  clients: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  guide: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

export const NAV_ITEMS = [
  { id: 'clients',  label: 'Clienti',    icon: Icons.clients  },
  { id: 'calendar', label: 'Calendario', icon: Icons.calendar },
  { id: 'guide',    label: 'Guida Test', icon: Icons.guide    },
  { id: 'profile',  label: 'Profilo',    icon: Icons.profile  },
]

export function TrainerShell({ page, setPage, children }) {
  return (
    <div className="min-h-screen text-white flex flex-col lg:flex-row">

      {/* ── Sidebar desktop (solo icone + tooltip) ── */}
      <aside
        className="hidden lg:flex flex-col items-center py-6 gap-2 sticky top-0 h-screen shrink-0 z-30 border-r border-white/[.05]"
        style={{ width: 64, backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <div className="mb-4 flex flex-col items-center">
          <span className="font-display font-black text-[13px] leading-none"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
              onClick={() => setPage(item.id)}
            />
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          title="Logout"
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border border-transparent hover:border-white/10 text-white/25 hover:text-white/60"
          style={{ background: 'transparent' }}
        >
          {Icons.logout}
        </button>
      </aside>

      {/* ── Layout mobile: header + tab bar ── */}
      <div className="lg:hidden flex-none">
        {/* Header mobile */}
        <header
          className="flex items-center justify-between px-5 py-3 border-b border-white/[.05] sticky top-0 z-30"
          style={{ background: 'rgba(7,11,20,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <span className="font-display font-black text-[17px]"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FITQUEST
          </span>
          <button onClick={logout} className="text-white/30 hover:text-white/60 transition-colors">
            {Icons.logout}
          </button>
        </header>

        {/* Tab bar mobile — stile Twitter/X */}
        <nav
          className="flex border-b border-white/[.05] sticky top-[49px] z-20"
          style={{ background: 'rgba(7,11,20,0.95)', backdropFilter: 'blur(12px)' }}
        >
          {NAV_ITEMS.map(item => (
            <TabItem
              key={item.id}
              item={item}
              active={page === item.id}
              onClick={() => setPage(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* ── Contenuto ── */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}

// ── Icona sidebar desktop con tooltip ────────────────────────────────────────
function SidebarIcon({ item, active, onClick }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border"
        style={{
          background:  active ? 'rgba(59,130,246,0.18)' : 'transparent',
          borderColor: active ? 'rgba(59,130,246,0.4)'  : 'transparent',
          color:       active ? '#60a5fa' : 'rgba(255,255,255,0.35)',
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background   = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color        = 'rgba(255,255,255,0.75)'
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background   = 'transparent'
            e.currentTarget.style.borderColor  = 'transparent'
            e.currentTarget.style.color        = 'rgba(255,255,255,0.35)'
          }
        }}
      >
        {item.icon}
      </button>

      {/* Tooltip label */}
      <div
        className="absolute left-[52px] top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
        style={{
          background:   'rgba(15,31,61,0.97)',
          border:       '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding:      '5px 10px',
          whiteSpace:   'nowrap',
        }}
      >
        <span className="font-display text-[11px] text-white/80 tracking-[1px]">
          {item.label.toUpperCase()}
        </span>
        {/* Freccia sinistra */}
        <div style={{
          position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
          width: 8, height: 8, background: 'rgba(15,31,61,0.97)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          rotate: '45deg',
        }} />
      </div>
    </div>
  )
}

// ── Tab item mobile ───────────────────────────────────────────────────────────
function TabItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer transition-all relative border-none"
      style={{ background: 'transparent' }}
    >
      {/* Indicatore attivo (linea sotto, stile Twitter) */}
      {active && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
          style={{ width: 32, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
        />
      )}
      <span style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>
        {item.icon}
      </span>
      <span
        className="font-display text-[9px] tracking-[0.5px]"
        style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}
      >
        {item.label.toUpperCase()}
      </span>
    </button>
  )
}
