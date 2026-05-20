import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal }                from 'react-dom'

// ── Costanti ──────────────────────────────────────────────────────────────────
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

/**
 * Menu circolare contestuale — trigger bottom-left, si apre al centro schermo.
 * Usa createPortal per sfuggire a parent con backdrop-filter che rompono il fixed.
 *
 * Props:
 *   items    [{ id, label, icon, isDanger? }]
 *   activeId  id della sezione/vista attiva (per highlight)
 *   onSelect  callback(id) — chiamata dopo la chiusura
 *   color     colore accent (default verde RX)
 */
export function ContextNav({ items, activeId, onSelect, color = '#0fd65a' }) {
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

  useEffect(() => {
    if (!open || closing) return
    const fn = e => { if (e.key === 'Escape') triggerClose(null) }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, closing, triggerClose])

  const xs         = vp.w < 390
  const WHEEL_R    = xs ? 115 : mobile ? 145 : 215
  const ITEM_SIZE  = xs ? 56  : mobile ? 68  : 80
  const HUB_SIZE   = xs ? 80  : mobile ? 100 : 124
  const ICON_SCALE = xs ? 1.2 : mobile ? 1.5 : 1.8

  // Trigger — bottom-left
  const trigCX   = TRIG_PAD + TRIG_SIZE / 2
  const trigCY   = vp.h - TRIG_PAD - TRIG_SIZE / 2
  // Anchor — centro viewport
  const anchorCX = vp.w / 2
  const anchorCY = vp.h / 2

  const angles    = circleAngles(items.length)
  const HUB_DELAY = Math.round(items.length * 0.55) * ITEM_STAGGER
  const WAIT      = HUB_DELAY + HUB_DUR + 50

  const activeItem = items.find(it => it.id === activeId) ?? null

  const triggerClose = useCallback((intent) => {
    if (closing) return
    intentRef.current = intent
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
      if (intent) onSelect(intent)
    }, WAIT)
  }, [closing, onSelect, WAIT])

  // ── Trigger button ─────────────────────────────────────────────────────────
  const triggerButton = (
    <button
      onClick={() => setOpen(true)}
      aria-label="Menu contestuale"
      style={{
        position: 'fixed',
        bottom: TRIG_PAD, left: TRIG_PAD,
        zIndex: 58,
        width: TRIG_SIZE, height: TRIG_SIZE,
        borderRadius: '50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2,
        cursor: 'pointer',
        background: 'rgba(5,9,14,0.93)',
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 14px ${color}22, 0 4px 18px rgba(0,0,0,0.7)`,
        color: color,
        backdropFilter: 'blur(10px)',
        transition: 'all 250ms ease',
      }}
    >
      {activeItem ? (
        <>
          <span style={{ display: 'flex', transform: 'scale(1.25)', pointerEvents: 'none' }}>
            {activeItem.icon}
          </span>
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 6,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: color + '80',
            lineHeight: 1,
            pointerEvents: 'none',
          }}>
            {activeItem.label.slice(0, 5)}
          </span>
        </>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/><circle cx="5" cy="12" r="1.2"/>
        </svg>
      )}
    </button>
  )

  // ── Overlay ────────────────────────────────────────────────────────────────
  const overlay = (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 62,
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
          const isActive = item.id === activeId
          const isDanger = !!item.isDanger

          const btnBg     = isDanger ? 'rgba(248,113,113,0.10)' : isActive ? `${color}1e` : 'rgba(6,10,16,0.97)'
          const btnBorder = isDanger ? 'rgba(248,113,113,0.45)' : isActive ? `${color}a0` : 'rgba(255,255,255,0.10)'
          const btnShadow = isActive ? `0 0 28px ${color}59, 0 2px 16px rgba(0,0,0,0.6)` : '0 4px 20px rgba(0,0,0,0.5)'
          const btnColor  = isDanger ? '#f87171' : isActive ? color : 'rgba(200,212,224,0.52)'
          const lblColor  = isDanger ? 'rgba(248,113,113,0.70)' : isActive ? color : 'rgba(200,212,224,0.38)'

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

        {/* Hub — mostra la sezione attiva e chiude il menu */}
        <button
          onClick={() => { if (!closing) triggerClose(null) }}
          aria-label="Chiudi"
          style={{
            position: 'absolute',
            top: -HUB_SIZE / 2, left: -HUB_SIZE / 2,
            width: HUB_SIZE, height: HUB_SIZE,
            borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4,
            cursor: closing ? 'default' : 'pointer',
            background: `radial-gradient(circle at 40% 35%, ${color}18 0%, rgba(4,8,14,0.98) 70%)`,
            border: `1.5px solid ${color}38`,
            boxShadow: `0 0 40px ${color}20, 0 8px 32px rgba(0,0,0,0.7)`,
            color: color,
            '--close-dx': `${trigCX - anchorCX}px`,
            '--close-dy': `${trigCY - anchorCY}px`,
            '--trig-scale': (TRIG_SIZE / HUB_SIZE).toFixed(3),
            animation: closing
              ? `rx-hub-out ${HUB_DUR}ms cubic-bezier(0.4,0,0.6,1) ${HUB_DELAY}ms both`
              : 'rx-nav-item-in 280ms cubic-bezier(0.34,1.56,0.64,1) both',
            zIndex: 1,
          }}
        >
          {activeItem ? (
            <>
              <span style={{ display: 'flex', transform: 'scale(1.8)', color, pointerEvents: 'none' }}>
                {activeItem.icon}
              </span>
              <span style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                fontSize: mobile ? 7 : 8,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: color + '70',
                lineHeight: 1,
                pointerEvents: 'none',
              }}>
                {activeItem.label}
              </span>
            </>
          ) : (
            <svg width={HUB_SIZE * 0.3} height={HUB_SIZE * 0.3} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </button>

      </div>
    </div>
  )

  // Entrambi i layer escono da createPortal → sfuggono a qualsiasi parent
  // con backdrop-filter/transform che romperebbe il position:fixed
  return createPortal(
    <>
      {triggerButton}
      {(open || closing) && overlay}
    </>,
    document.body
  )
}
