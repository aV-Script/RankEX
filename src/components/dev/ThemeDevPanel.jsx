// ThemeDevPanel — overlay dev-only, visibile solo in isDev
// Toggle: Ctrl+Shift+T  |  Click fuori per chiudere
// Permette di confrontare tutti i temi e salvare il preferito

import { useState, useEffect, useCallback } from 'react'
import { useTheme }                          from '../../context/ThemeContext'
import { isDev }                             from '../../utils/env'

const ICON_CLOSE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ICON_PALETTE = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0 0 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
)

const PREVIEW_H = 120

function ThemePreviewCard({ theme, active, previewing, onHover, onLeave, onSelect }) {
  return (
    <div
      onMouseEnter={() => onHover(theme.id)}
      onMouseLeave={onLeave}
      onClick={() => onSelect(theme.id)}
      className="cursor-pointer rounded-xl overflow-hidden flex-shrink-0 transition-transform"
      style={{
        width: 140,
        outline: active ? `2px solid ${theme.swatches[0]}` : previewing ? `2px solid ${theme.swatches[0]}80` : '2px solid transparent',
        transform: previewing ? 'scale(1.03)' : 'scale(1)',
        boxShadow: active ? `0 0 20px ${theme.swatches[0]}40` : 'none',
      }}
    >
      {/* Mini "app" preview */}
      <div
        style={{
          height: PREVIEW_H,
          background: '#080c12',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Simulated sidebar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, background: 'rgba(0,0,0,0.5)', borderRight: `1px solid ${theme.vars['--rx-border']}` }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ margin: '8px auto 0', width: 14, height: 14, borderRadius: 3, background: i === 0 ? theme.swatches[0] + '40' : 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
        {/* Simulated content */}
        <div style={{ position: 'absolute', left: 36, right: 8, top: 8 }}>
          {/* Card */}
          <div style={{ background: 'var(--rx-surface)', border: `1px solid ${theme.vars['--rx-border']}`, borderRadius: 6, padding: '6px 8px', marginBottom: 6 }}>
            <div style={{ height: 5, width: 40, borderRadius: 2, background: theme.swatches[0] + '90', marginBottom: 4 }} />
            <div style={{ height: 3, width: '80%', borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 3 }} />
            <div style={{ height: 3, width: '60%', borderRadius: 2, background: 'rgba(255,255,255,0.05)' }} />
          </div>
          {/* Gradient button */}
          <div style={{ height: 18, borderRadius: 4, background: `linear-gradient(135deg, ${theme.swatches[0]} 0%, ${theme.swatches[1]} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ height: 3, width: 32, borderRadius: 2, background: 'rgba(0,0,0,0.3)' }} />
          </div>
          {/* XP bar */}
          <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '62%', background: `linear-gradient(90deg, ${theme.swatches[0]}, ${theme.swatches[1]})`, borderRadius: 2 }} />
          </div>
        </div>
        {/* Glow overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 80% 80% at 80% 20%, ${theme.swatches[1]}18 0%, transparent 70%)`,
        }} />
      </div>

      {/* Name + active badge */}
      <div style={{ background: '#0a0e15', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: active ? theme.swatches[0] : 'rgba(255,255,255,0.7)' }}>
            {theme.name}
          </div>
        </div>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.swatches[0]}, ${theme.swatches[1]})`,
          opacity: active ? 1 : 0.3,
        }} />
      </div>
    </div>
  )
}

export function ThemeDevPanel() {
  const { themes, themeId, setTheme, previewTheme, cancelPreview } = useTheme()
  const [open,       setOpen]       = useState(false)
  const [previewing, setPreviewing] = useState(null)

  // Ctrl+Shift+T toggle
  useEffect(() => {
    if (!isDev) return
    function onKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleHover = useCallback((id) => {
    setPreviewing(id)
    previewTheme(id)
  }, [previewTheme])

  const handleLeave = useCallback(() => {
    setPreviewing(null)
    cancelPreview()
  }, [cancelPreview])

  const handleSelect = useCallback((id) => {
    setPreviewing(null)
    setTheme(id)
    setOpen(false)
  }, [setTheme])

  if (!isDev) return null
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { setOpen(false); cancelPreview(); setPreviewing(null) }}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(8,11,18,0.97)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16,
          padding: '16px 18px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          maxWidth: '95vw',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
              DEV — Theme Picker
            </div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Passa il mouse per anteprima · click per salvare
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); cancelPreview(); setPreviewing(null) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4 }}
          >
            {ICON_CLOSE}
          </button>
        </div>

        {/* Theme cards */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {themes.map(t => (
            <ThemePreviewCard
              key={t.id}
              theme={t}
              active={t.id === themeId}
              previewing={previewing === t.id}
              onHover={handleHover}
              onLeave={handleLeave}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Shortcut hint */}
        <div style={{ marginTop: 12, fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: '1px', color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
          Ctrl+Shift+T per aprire/chiudere
        </div>
      </div>
    </>
  )
}
