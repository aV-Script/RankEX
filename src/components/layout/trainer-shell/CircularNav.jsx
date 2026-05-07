import { useState, useEffect, useRef } from 'react'
import { useTrainerState } from '../../../context/TrainerContext'
import { NAV_ITEMS, ORG_ADMIN_NAV_ITEMS, LogoutIcon } from './navItems.config'

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
function pentaPath(s) {
  const c = s / 2, r = s * 0.38
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = ((i * 72) - 90) * Math.PI / 180
    return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`
  })
  return `M ${pts.join(' L ')} Z`
}

export function CircularNav({ page, onNavigate, onLogout }) {
  const { userRole }          = useTrainerState()
  const [open, setOpen]       = useState(true)
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

  useEffect(() => {
    if (!open || closing) return
    const fn = e => { if (e.key === 'Escape') triggerClose(null) }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, closing])

  const xs         = vp.w < 390
  const WHEEL_R    = xs ? 115 : mobile ? 145 : 215
  const ITEM_SIZE  = xs ? 56  : mobile ? 68  : 80
  const HUB_SIZE   = xs ? 80  : mobile ? 100 : 124
  const ICON_SCALE = xs ? 1.2 : mobile ? 1.5 : 1.8

  const trigCX  = vp.w - TRIG_PAD - TRIG_SIZE / 2
  const trigCY  = vp.h - TRIG_PAD - TRIG_SIZE / 2
  const anchorCX = vp.w / 2
  const anchorCY = vp.h / 2

  const navItemsBase = userRole === 'org_admin'
    ? [...NAV_ITEMS, ...ORG_ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  const esciItem = { id: '__logout__', label: 'Esci', icon: LogoutIcon, isLogout: true }
  const esciIdx  = Math.floor((navItemsBase.length + 1) / 2)
  const items    = [
    ...navItemsBase.slice(0, esciIdx).map(it => ({ ...it, isLogout: false })),
    esciItem,
    ...navItemsBase.slice(esciIdx).map(it => ({ ...it, isLogout: false })),
  ]

  const angles    = circleAngles(items.length)
  const HUB_DELAY = Math.round(items.length * 0.55) * ITEM_STAGGER
  const WAIT      = HUB_DELAY + HUB_DUR + 50

  function triggerClose(intent) {
    if (closing) return
    intentRef.current = intent
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
      if (intent === '__logout__') onLogout()
      else if (intent)            onNavigate(intent)
    }, WAIT)
  }

  if (!open && !closing) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu principale"
        style={{
          position: 'fixed',
          bottom: TRIG_PAD, right: TRIG_PAD,
          zIndex: 60,
          width: TRIG_SIZE, height: TRIG_SIZE,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          background: 'rgba(5,9,14,0.93)',
          border: '1.5px solid rgba(15,214,90,0.38)',
          boxShadow: '0 0 14px rgba(15,214,90,0.22), 0 4px 18px rgba(0,0,0,0.7)',
          color: 'rgba(15,214,90,0.78)',
          backdropFilter: 'blur(10px)',
          transition: 'all 250ms ease',
        }}
      >
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
          <rect x="0"  y="0"    width="20" height="2.5" rx="1.25" fill="currentColor"/>
          <rect x="3"  y="6.75" width="14" height="2.5" rx="1.25" fill="currentColor"/>
          <rect x="7"  y="13.5" width="6"  height="2.5" rx="1.25" fill="currentColor"/>
        </svg>
      </button>
    )
  }

  return (
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
          const isActive = !item.isLogout && page === item.id
          const half     = ITEM_SIZE / 2

          const btnBg     = item.isLogout ? 'rgba(248,113,113,0.10)' : isActive ? 'rgba(15,214,90,0.18)' : 'rgba(6,10,16,0.97)'
          const btnBorder = item.isLogout ? 'rgba(248,113,113,0.45)' : isActive ? 'rgba(15,214,90,0.65)' : 'rgba(255,255,255,0.10)'
          const btnShadow = isActive ? '0 0 28px rgba(15,214,90,0.35), 0 2px 16px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.5)'
          const btnColor  = item.isLogout ? '#f87171' : isActive ? '#0fd65a' : 'rgba(200,212,224,0.52)'
          const lblColor  = item.isLogout ? 'rgba(248,113,113,0.70)' : isActive ? '#0fd65a' : 'rgba(200,212,224,0.38)'

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
                onClick={() => { if (!closing) triggerClose(item.isLogout ? '__logout__' : item.id) }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
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

        {/* Hub centrale — RX pentagon, vola verso il trigger in chiusura */}
        <button
          onClick={() => { if (!closing) triggerClose(null) }}
          aria-label="Chiudi menu"
          style={{
            position: 'absolute',
            top: -HUB_SIZE / 2, left: -HUB_SIZE / 2,
            width: HUB_SIZE, height: HUB_SIZE,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: closing ? 'default' : 'pointer',
            background: 'rgba(4,8,14,0.98)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 0 50px rgba(15,214,90,0.14), 0 8px 32px rgba(0,0,0,0.7)',
            color: 'rgba(15,214,90,0.82)',
            '--close-dx': `${trigCX - anchorCX}px`,
            '--close-dy': `${trigCY - anchorCY}px`,
            '--trig-scale': (TRIG_SIZE / HUB_SIZE).toFixed(3),
            animation: closing
              ? `rx-hub-out ${HUB_DUR}ms cubic-bezier(0.4,0,0.6,1) ${HUB_DELAY}ms both`
              : 'rx-nav-item-in 280ms cubic-bezier(0.34,1.56,0.64,1) both',
            zIndex: 1,
          }}
        >
          <svg width={HUB_SIZE * 0.62} height={HUB_SIZE * 0.62} viewBox="0 0 100 100" fill="none">
            <path d={pentaPath(100)} stroke="currentColor" strokeWidth="2.5" />
            <text
              x="50" y="52"
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="Montserrat, sans-serif"
              fontWeight="900"
              fontSize={mobile ? '20' : '22'}
              letterSpacing="2"
              fill="currentColor"
            >RX</text>
          </svg>
        </button>

      </div>
    </div>
  )
}
