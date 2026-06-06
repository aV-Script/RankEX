import { useState, useEffect, useRef, useCallback } from 'react'
import { logout }        from '../../../firebase/services/auth'
import { SoccerAvatar }  from './avatar/SoccerAvatar'

const TRIG_SIZE    = 48
const TRIG_PAD     = 24
const ITEM_DUR     = 260
const ITEM_STAGGER = 18
const HUB_DUR      = 360

function circleAngles(n) {
  return Array.from({ length: n }, (_, i) => 90 - (360 / n) * i)
}
function toXY(deg, r) {
  const rad = (deg * Math.PI) / 180
  return { x: Math.cos(rad) * r, y: -Math.sin(rad) * r }
}

const BellIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const LogoutIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

export function ClientCircularNav({
  tabs,
  activeTab,
  onTabChange,
  unreadCount = 0,
  onOpenNotifs,
  color,
  client = null,
  openTrigger = 0,
}) {
  const [open, setOpen]       = useState(false)
  const [closing, setClosing] = useState(false)
  const [mobile, setMobile]   = useState(() => window.innerWidth < 768)
  const [vp, setVp]           = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const intentRef             = useRef(null)

  useEffect(() => {
    const fn = () => {
      setMobile(window.innerWidth < 768)
      setVp({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Apre il menu quando l'hub avatar viene tappato
  useEffect(() => {
    if (openTrigger > 0 && !open && !closing) setOpen(true)
  }, [openTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const xs         = vp.w < 390
  const WHEEL_R    = xs ? 115 : mobile ? 145 : 215
  const ITEM_SIZE  = xs ? 56  : mobile ? 68  : 80
  const HUB_SIZE   = xs ? 80  : mobile ? 100 : 124
  const ICON_SCALE = xs ? 1.2 : mobile ? 1.5 : 1.8

  const trigCX  = vp.w - TRIG_PAD - TRIG_SIZE / 2
  const trigCY  = vp.h - TRIG_PAD - TRIG_SIZE / 2
  const anchorCX = vp.w / 2
  const anchorCY = vp.h / 2

  const navTabs    = tabs.filter(t => !t.mobileOnly)
  const notifsItem = { id: '__notifs__', label: 'Notifiche', icon: BellIcon, isNotifs: true }
  const esciItem   = { id: '__logout__', label: 'Esci',      icon: LogoutIcon, isLogout: true }
  const esciIdx    = Math.floor((navTabs.length + 1) / 2)
  const withEsci   = [
    ...navTabs.slice(0, esciIdx),
    esciItem,
    ...navTabs.slice(esciIdx),
  ]
  const items = [...withEsci, notifsItem]

  const angles    = circleAngles(items.length)
  const HUB_DELAY = Math.round(items.length * 0.55) * ITEM_STAGGER
  const WAIT      = HUB_DELAY + HUB_DUR + 50

  const triggerClose = useCallback((intent) => {
    if (closing) return
    intentRef.current = intent
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
      if      (intent === '__logout__') logout()
      else if (intent === '__notifs__') onOpenNotifs?.()
      else if (intent)                  onTabChange(intent)
    }, WAIT)
  }, [closing, onOpenNotifs, onTabChange, WAIT])

  useEffect(() => {
    if (!open || closing) return
    const fn = e => { if (e.key === 'Escape') triggerClose(null) }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, closing, triggerClose])

  // ── Trigger button (sempre visibile quando chiuso) ─────────────────
  const triggerButton = (
    <button
      onClick={() => setOpen(true)}
      aria-label="Menu navigazione"
      style={{
        position: 'fixed',
        bottom: TRIG_PAD, right: TRIG_PAD,
        zIndex: 60,
        width: TRIG_SIZE, height: TRIG_SIZE,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        background: 'rgba(5,9,14,0.93)',
        border: `1.5px solid ${color}60`,
        boxShadow: `0 0 14px ${color}38, 0 4px 18px rgba(0,0,0,0.7)`,
        color: color,
        backdropFilter: 'blur(10px)',
        transition: 'all 250ms ease',
      }}
    >
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 16, height: 16, borderRadius: '50%',
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: '#000',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
        <rect x="0"  y="0"    width="20" height="2.5" rx="1.25" fill="currentColor"/>
        <rect x="3"  y="6.75" width="14" height="2.5" rx="1.25" fill="currentColor"/>
        <rect x="7"  y="13.5" width="6"  height="2.5" rx="1.25" fill="currentColor"/>
      </svg>
    </button>
  )

  if (!open && !closing) return triggerButton

  return (
    <>
      {triggerButton}
      <div
        className="fixed inset-0 z-50"
        style={{
          background:     closing ? 'rgba(3,5,9,0)' : 'rgba(3,5,9,0.82)',
          backdropFilter: closing ? 'blur(0px)'      : 'blur(12px)',
          transition:     closing ? `background ${WAIT * 0.7}ms ease, backdrop-filter ${WAIT * 0.7}ms ease` : 'none',
          pointerEvents:  closing ? 'none' : 'auto',
        }}
        onClick={e => { if (e.target === e.currentTarget && !closing) triggerClose(null) }}
      >
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>

          {items.map((item, i) => {
            const { x, y } = toXY(angles[i], WHEEL_R)
            const half     = ITEM_SIZE / 2
            const isActive = !item.isLogout && !item.isNotifs && activeTab === item.id

            const btnBg     = item.isLogout ? 'rgba(248,113,113,0.10)' : item.isNotifs ? `${color}10` : isActive ? `${color}1e` : 'rgba(6,10,16,0.97)'
            const btnBorder = item.isLogout ? 'rgba(248,113,113,0.45)' : item.isNotifs ? `${color}60` : isActive ? `${color}a0` : 'rgba(255,255,255,0.10)'
            const btnShadow = isActive ? `0 0 28px ${color}59, 0 2px 16px rgba(0,0,0,0.6)` : '0 4px 20px rgba(0,0,0,0.5)'
            const btnColor  = item.isLogout ? '#f87171' : item.isNotifs ? color : isActive ? color : 'rgba(200,212,224,0.52)'
            const lblColor  = item.isLogout ? 'rgba(248,113,113,0.70)' : item.isNotifs ? `${color}b0` : isActive ? color : 'rgba(200,212,224,0.38)'

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: y - half, left: x - half,
                  width: ITEM_SIZE,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  '--hub-dx': `${-x}px`,
                  '--hub-dy': `${-y}px`,
                  animation: closing
                    ? `rx-nav-item-out ${ITEM_DUR}ms cubic-bezier(0.4,0,1,1) ${i * ITEM_STAGGER}ms both`
                    : `rx-nav-item-in  390ms cubic-bezier(0.34,1.56,0.64,1) ${i * 42}ms both`,
                  pointerEvents: closing ? 'none' : 'auto',
                }}
              >
                <button
                  onClick={() => { if (!closing) triggerClose(item.id) }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    position: 'relative',
                    width: ITEM_SIZE, height: ITEM_SIZE,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                    background: btnBg,
                    border: `1.5px solid ${btnBorder}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: btnShadow,
                    color: btnColor,
                    transition: 'background 150ms, box-shadow 150ms',
                  }}
                >
                  <span style={{ display: 'flex', transform: `scale(${ICON_SCALE})`, pointerEvents: 'none' }}>
                    {item.icon}
                  </span>
                  {item.isNotifs && unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 14, height: 14, borderRadius: '50%',
                      background: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 700, color: '#000',
                      fontFamily: 'Montserrat, sans-serif',
                      pointerEvents: 'none',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <span aria-hidden="true" style={{
                  marginTop: 8,
                  fontSize: mobile ? 9 : 10,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '1.3px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  color: lblColor,
                }}>
                  {item.label}
                </span>
              </div>
            )
          })}

          {/* Hub — avatar reale nel colore del rank */}
          <button
            onClick={() => { if (!closing) triggerClose(null) }}
            aria-label="Chiudi menu"
            style={{
              position: 'absolute',
              top: -HUB_SIZE / 2, left: -HUB_SIZE / 2,
              width: HUB_SIZE, height: HUB_SIZE,
              borderRadius: '50%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              cursor: closing ? 'default' : 'pointer',
              border: `1.5px solid ${color}38`,
              boxShadow: `0 0 40px ${color}20, 0 0 80px ${color}0a, 0 8px 32px rgba(0,0,0,0.7)`,
              '--close-dx': `${trigCX - anchorCX}px`,
              '--close-dy': `${trigCY - anchorCY}px`,
              '--trig-scale': (TRIG_SIZE / HUB_SIZE).toFixed(3),
              animation: closing
                ? `rx-hub-out ${HUB_DUR}ms cubic-bezier(0.4,0,0.6,1) ${HUB_DELAY}ms both`
                : 'rx-nav-item-in 280ms cubic-bezier(0.34,1.56,0.64,1) both',
              zIndex: 1,
              padding: 0,
            }}
          >
            {client ? (
              <NavHubAvatar client={client} color={color} size={HUB_SIZE} />
            ) : (
              <span style={{
                fontFamily: 'Montserrat, sans-serif', fontWeight: 900,
                fontSize: Math.round(HUB_SIZE * 0.40), lineHeight: 1,
                color, letterSpacing: '-1px',
              }}>
                {client?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </button>

        </div>
      </div>
    </>
  )
}

// Avatar piccolo per il centro del menu — stessa dimensione dell'hub circle
function NavHubAvatar({ client, color, size }) {
  const av = client.avatar ?? {}
  return (
    <SoccerAvatar
      color={color}
      skinTone={av.skinTone}
      hairColor={av.hairColor}
      hairStyle={av.hairStyle}
      expression={av.expression}
      accessory={av.accessory}
      clothing={av.clothing}
      jerseyColor={av.jerseyColor}
      facialHair={av.facialHair}
      facialHairColor={av.facialHairColor}
      clothingGraphic={av.clothingGraphic}
      hatColor={av.hatColor}
      accessoriesColor={av.accessoriesColor}
      number={av.number}
      width={size}
      height={size}
    />
  )
}
