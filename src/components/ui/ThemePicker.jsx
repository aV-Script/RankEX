import { useTheme } from '../../context/ThemeContext'

// ── Swatch circle + check ─────────────────────────────────────────────────────

function Swatch({ colors }) {
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
        flexShrink: 0,
      }}
    />
  )
}

const ICON_CHECK = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── ThemePicker — compatto, embed in settings ─────────────────────────────────

export function ThemePicker() {
  const { themes, themeId, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-1.5">
      {themes.map(t => {
        const active = t.id === themeId
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-3 cursor-pointer rounded-lg transition-all text-left w-full"
            style={{
              padding:    '9px 12px',
              background: active ? t.swatches[0] + '14' : 'transparent',
              border:     `1px solid ${active ? t.swatches[0] + '55' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <Swatch colors={t.swatches} />
            <div className="flex-1 min-w-0">
              <div
                className="font-display font-black uppercase"
                style={{ fontSize: 11, letterSpacing: '1.5px', color: active ? t.swatches[0] : 'rgba(255,255,255,0.85)' }}
              >
                {t.name}
              </div>
              <div
                className="font-body"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', marginTop: 1 }}
              >
                {t.desc}
              </div>
            </div>
            {active && (
              <div style={{ color: t.swatches[0], flexShrink: 0 }}>
                {ICON_CHECK}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
