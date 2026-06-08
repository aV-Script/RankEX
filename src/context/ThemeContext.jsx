import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEMES, THEMES_MAP, DEFAULT_THEME } from '../config/themes.config'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'rankex-theme'

// ── Applica tema a DOM (CSS vars + background) ────────────────────────────────

function buildBgImage(bg) {
  const svgEnc = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='116'>` +
    `<polygon points='60,6 110,42 91,100 30,100 11,42' fill='none' stroke='${bg.pattern}' stroke-width='0.8'/>` +
    `</svg>`
  )
  return [
    `radial-gradient(ellipse 120% 120% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)`,
    `radial-gradient(ellipse 45% 60% at -3% 62%, ${bg.glow1} 0%, transparent 65%)`,
    `radial-gradient(ellipse 35% 25% at 106% -2%, ${bg.glow2} 0%, transparent 55%)`,
    `url("data:image/svg+xml,${svgEnc}")`,
    `linear-gradient(${bg.grid} 1px, transparent 1px)`,
    `linear-gradient(90deg, ${bg.grid} 1px, transparent 1px)`,
  ].join(', ')
}

function applyTheme(theme) {
  const root = document.documentElement

  // CSS variables
  for (const [key, val] of Object.entries(theme.vars)) {
    root.style.setProperty(key, val)
  }

  // Background glow/pattern override via injected <style>
  let el = document.getElementById('rx-theme-bg')
  if (!el) {
    el = document.createElement('style')
    el.id = 'rx-theme-bg'
    document.head.appendChild(el)
  }
  el.textContent = `html { background-color: ${theme.bg.base ?? '#06080d'} !important; background-image: ${buildBgImage(theme.bg)} !important; }`
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME } catch { return DEFAULT_THEME }
  })

  const theme = THEMES_MAP[themeId] ?? THEMES_MAP[DEFAULT_THEME]

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((id) => {
    const t = THEMES_MAP[id]
    if (!t) return
    setThemeId(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch {}
    applyTheme(t)
  }, [])

  const previewTheme = useCallback((id) => {
    const t = THEMES_MAP[id]
    if (t) applyTheme(t)
  }, [])

  const cancelPreview = useCallback(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, themeId, themes: THEMES, setTheme, previewTheme, cancelPreview }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
