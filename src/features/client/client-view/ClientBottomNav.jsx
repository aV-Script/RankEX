// ClientBottomNav — barra di navigazione fissa in basso (mobile)
// e nav orizzontale in alto (desktop, quando non sull'hub)

import { useState }       from 'react'
import { AvatarDisplay }  from './avatar/AvatarDisplay'
import { logout }         from '../../../firebase/services/auth'
import { BellIcon, LogoutIcon } from './client.config'
import { ConfirmDialog }  from '../../../components/common/ConfirmDialog'
import {
  ICON_TEST, ICON_TROFEI, ICON_CALENDARIO, ICON_PROFILO,
} from './ClientHub'

// ── Slot bottom nav: [Test] [Trofei] [○avatar○] [Calendario] [Profilo] ────────

const BOTTOM_ITEMS = [
  { id: 'test',       label: 'Test',       icon: ICON_TEST },
  { id: 'trofei',     label: 'Trofei',     icon: ICON_TROFEI },
  // center = home avatar
  { id: 'calendario', label: 'Calendario', icon: ICON_CALENDARIO },
  { id: 'profilo',    label: 'Profilo',    icon: ICON_PROFILO },
]

// ── Slot top nav desktop: tutte le 5 sezioni ──────────────────────────────────

import { ICON_SCHEDA, PENTAGON_SECTIONS } from './ClientHub'

// ── Componente ────────────────────────────────────────────────────────────────

export function ClientBottomNav({
  activeTab,
  onTabChange,
  color,
  client,
  orgId,
  unreadCount = 0,
  onOpenNotifs,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const isHome     = activeTab === 'home'
  const isActive   = (id) => activeTab === id || activeTab.startsWith(id + '/')

  // ── NavBtn compatto (mobile bassa + desktop alta) ──────────────────────────

  function NavBtn({ id, label, icon, compact = false }) {
    const active = isActive(id)
    return (
      <button
        onClick={() => onTabChange(id)}
        style={{
          flex: 1, display: 'flex', flexDirection: compact ? 'row' : 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: compact ? 6 : 3,
          cursor: 'pointer', background: 'none', border: 'none',
          padding: compact ? '0 10px' : '6px 2px',
          minWidth: 0,
        }}
      >
        <span style={{ color: active ? 'var(--rx-green)' : 'rgba(255,255,255,0.28)', transition: 'color 180ms', flexShrink: 0 }}>
          {icon}
        </span>
        <span className="font-display" style={{
          fontWeight: 700,
          fontSize: compact ? 10 : 8, letterSpacing: compact ? '1px' : '1.5px',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
          color: active ? 'var(--rx-green)' : 'rgba(255,255,255,0.22)', transition: 'color 180ms',
        }}>
          {label}
        </span>
      </button>
    )
  }

  return (
    <>
      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          height: 62,
          background: 'var(--rx-nav-bg)',
          borderTop: '1px solid var(--rx-border)',
          backdropFilter: 'blur(14px)',
        }}
      >
        {/* Left 2 */}
        {BOTTOM_ITEMS.slice(0, 2).map(item => (
          <NavBtn key={item.id} {...item} />
        ))}

        {/* Center — campana notifiche */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <button
            onClick={onOpenNotifs}
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0,
              padding: '6px 2px',
              color: unreadCount > 0 ? color : 'rgba(255,255,255,0.28)',
              transition: 'color 200ms',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="font-display" style={{
                position: 'absolute', top: 2, right: 0,
                minWidth: 13, height: 13, borderRadius: 7,
                background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, fontWeight: 700, color: '#000', padding: '0 2px',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <span className="font-display" style={{
            fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700,
            color: unreadCount > 0 ? color : 'rgba(255,255,255,0.22)',
          }}>
            Notifiche
          </span>
        </div>

        {/* Right 2 */}
        {BOTTOM_ITEMS.slice(2).map(item => (
          <NavBtn key={item.id} {...item} />
        ))}
      </nav>

      {/* ── Desktop top nav (solo quando non sull'hub) ────────────────── */}
      {!isHome && (
        <nav
          className="hidden lg:flex items-center px-6 sticky top-0 z-30"
          style={{
            height: 52,
            background: 'var(--rx-nav-bg)',
            borderBottom: '1px solid var(--rx-border)',
            backdropFilter: 'blur(14px)',
          }}
        >
          {/* Avatar → home */}
          <button
            onClick={() => onTabChange('home')}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              overflow: 'hidden', padding: 0,
              border: '1.5px solid color-mix(in srgb, var(--rx-green) 40%, transparent)',
              cursor: 'pointer', background: 'var(--rx-surface)',
              flexShrink: 0, marginRight: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AvatarDisplay
              avatarId={client?.avatarId} orgId={orgId} width={34} height={34}
            />
          </button>

          {/* Sezioni — tutte e 5 */}
          <div className="flex-1 flex justify-center gap-0.5">
            {PENTAGON_SECTIONS.map(sec => {
              const active = isActive(sec.id)
              return (
                <button
                  key={sec.id}
                  onClick={() => onTabChange(sec.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0 14px', height: 52,
                    cursor: 'pointer', background: 'none', border: 'none',
                    borderBottom: `2px solid ${active ? 'var(--rx-green)' : 'transparent'}`,
                    transition: 'border-color 180ms',
                  }}
                >
                  <span style={{ color: active ? 'var(--rx-green)' : 'rgba(255,255,255,0.30)', transition: 'color 180ms' }}>
                    {sec.icon}
                  </span>
                  <span className="font-display" style={{
                    fontWeight: 700,
                    fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
                    color: active ? 'var(--rx-green)' : 'rgba(255,255,255,0.30)', transition: 'color 180ms',
                  }}>
                    {sec.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Notifiche + logout */}
          <div className="flex items-center gap-1" style={{ marginLeft: 16 }}>
            <button
              onClick={onOpenNotifs}
              style={{
                position: 'relative', width: 34, height: 34,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              {BellIcon}
              {unreadCount > 0 && (
                <span className="font-display" style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 12, height: 12, borderRadius: '50%',
                  background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 700, color: '#000',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: 'none', border: 'none',
                color: 'rgba(248,113,113,0.50)',
              }}
            >
              {LogoutIcon}
            </button>
          </div>
        </nav>
      )}

      {showLogoutConfirm && (
        <ConfirmDialog
          title="Disconnetti"
          description="Sei sicuro di voler uscire dall'account?"
          confirmLabel="ESCI"
          cancelLabel="ANNULLA"
          variant="danger"
          onConfirm={logout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  )
}
